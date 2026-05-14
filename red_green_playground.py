from flask import Flask, request, jsonify, send_from_directory, send_file
import os
import subprocess
import tempfile
import requests

# PHYSICS SIM

import pymunk
from flask import Flask, request, jsonify

import numpy as np
import pymunk
from tqdm import tqdm
import matplotlib.pyplot as plt
import numpy as np
from scipy.stats import vonmises
import matplotlib
import matplotlib.animation as animation
import matplotlib.pyplot as plt
import os
import copy
import json

GLOBAL_SIM_DATA = None

# Define the path to the React build folder relative to this file
build_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "build")
assets_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
# Note: site_static_assets are now served from AWS S3, not locally

# Flask app initialization
app = Flask(__name__, static_folder=os.path.join(build_path, "static"))


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

def get_anim(frames, framerate=30, skip_t = 1):
    """
    frames: list of N np.arrays (H x W x 3)
    framerate: frames per second
    """
    height, width, _ = frames[0].shape
    dpi = 70
    # orig_backend = matplotlib.get_backend()
    matplotlib.use('Agg')  # Switch to headless 'Agg' to inhibit figure rendering.
    max_figsize_width = 6

    fig, ax = plt.subplots(1, 1, figsize=(max_figsize_width, max_figsize_width*(height/width)))
    # matplotlib.use(orig_backend)  # Switch back to the original backend.
    ax.set_axis_off()
    # ax.set_aspect('equal')
    ax.set_position([0, 0, 1, 1])
    im = ax.imshow(frames[0])
    def update(frame):
      if frame % skip_t == 0:
        im.set_data(frames[frame])
        # return [im]
    interval = 1000/framerate
    anim = animation.FuncAnimation(fig=fig, func=update, frames=np.arange(frames.shape[0]),
      interval=interval, blit=False, repeat=True)
    plt.close()
    return anim

def save_to_json(data, filename="data.json"):
    try:
        with open(filename, "w") as json_file:
            json.dump(data, json_file, indent=4)
        print(f"Data successfully saved to {filename}")
    except Exception as e:
        print(f"An error occurred while saving to JSON: {e}")

def check_collision_with_ball(x1, y1, r1, x2, y2, r2):
    """Check if two circles collide"""
    dist_sq = (x1 - x2)**2 + (y1 - y2)**2
    return dist_sq < (r1 + r2)**2

def simulate_key_distractor(keyDistractor, sim_data, worldWidth, worldHeight, TIMESTEP, FRAME_INTERVAL, FPS, ballSpeed, elasticity, friction, space):
    """Simulate a single key distractor"""
    startFrame = keyDistractor['startFrame']
    x = keyDistractor['x']  # Bottom-left corner x
    y = keyDistractor['y']  # Bottom-left corner y
    direction = keyDistractor['direction']
    duration = keyDistractor['duration']
    distractor_speed = keyDistractor.get('speed', ballSpeed)  # Get speed from keyDistractor, default to ballSpeed
    
    # Calculate number of frames for this distractor
    numDistractorFrames = int(duration * FPS)
    
    # Create a new pymunk space for this distractor (to avoid interfering with main ball)
    distractor_space = pymunk.Space()
    distractor_space.gravity = (0, 0)
    
    # Add walls
    static_body = distractor_space.static_body
    walls = [
        pymunk.Segment(static_body, (0, 0), (worldWidth, 0), 0.01),
        pymunk.Segment(static_body, (0, 0), (0, worldHeight), 0.01),
        pymunk.Segment(static_body, (worldWidth, 0), (worldWidth, worldHeight), 0.01),
        pymunk.Segment(static_body, (0, worldHeight), (worldWidth, worldHeight), 0.01),
    ]
    for wall in walls:
        wall.elasticity = elasticity
        wall.friction = friction
        distractor_space.add(wall)
    
    # Add barriers from sim_data
    for barrier in sim_data['barriers']:
        body = pymunk.Body(body_type=pymunk.Body.STATIC)
        body.position = (barrier['x'] + barrier['width'] / 2, barrier['y'] + barrier['height'] / 2)
        shape = pymunk.Poly.create_box(body, (barrier['width'], barrier['height']))
        shape.elasticity = elasticity
        shape.friction = friction
        distractor_space.add(body, shape)
    
    # Create distractor ball
    radius = sim_data['target']['size'] / 2
    mass = 1.0
    moment = pymunk.moment_for_circle(mass, 0, radius)
    body = pymunk.Body(mass, moment, body_type=pymunk.Body.DYNAMIC)
    # Convert bottom-left corner to center for pymunk body position
    body.position = (x + radius, y + radius)
    # Scale velocity based on distractor speed relative to main ball speed
    # TIMESTEP is calibrated for ballSpeed, so velocity magnitude should be distractor_speed/ballSpeed
    velocity_scale = distractor_speed / ballSpeed
    vx, vy = velocity_scale * np.cos(direction), velocity_scale * np.sin(direction)
    body.velocity = (vx, vy)
    shape = pymunk.Circle(body, radius)
    shape.elasticity = elasticity
    shape.friction = friction
    distractor_space.add(body, shape)
    
    # Simulate and record positions
    distractor_data = {
        'startFrame': startFrame,
        'duration': duration,
        'step_data': {}
    }
    
    for frame in range(numDistractorFrames):
        if frame != 0:
            for _ in range(FRAME_INTERVAL):
                distractor_space.step(TIMESTEP)
        
        tx, ty = body.position.x - radius, body.position.y - radius
        global_frame = startFrame + frame
        
        # Scale velocity by ballSpeed to reflect actual speed in diameters/second
        # The physics simulation uses velocities scaled by distractor_speed/ballSpeed,
        # so multiplying by ballSpeed gives us the actual distractor_speed
        vx_scaled = body.velocity.x * ballSpeed
        vy_scaled = body.velocity.y * ballSpeed
        
        # No collision stopping for key distractors - they can overlap with the regular ball
        distractor_data['step_data'][global_frame] = {
            'x': tx,
            'y': ty,
            'vx': vx_scaled,
            'vy': vy_scaled
        }
    
    return distractor_data

def generate_random_distractors(randomParams, sim_data, worldWidth, worldHeight, TIMESTEP, FRAME_INTERVAL, FPS, ballSpeed, elasticity, friction, space):
    """Generate and simulate random distractors"""
    probability = randomParams['probability']
    seed = randomParams['seed']
    duration = randomParams['duration']
    maxActive = randomParams.get('maxActive', 5)  # Default to 5 if not specified
    startDelay = randomParams.get('startDelay', 0.333)  # Default to ~10 frames at 30fps (0.333 seconds)
    
    np.random.seed(seed)
    
    radius = sim_data['target']['size'] / 2
    numFrames = sim_data['num_frames']
    numDistractorFrames = int(duration * FPS)
    
    # Convert start delay from seconds to frames
    startDelayFrames = int(startDelay * FPS)
    
    random_distractors = []
    
    # For each frame, potentially spawn a distractor
    for frame in range(numFrames):
        # Skip frames before the start delay - no random distractors before this time
        if frame < startDelayFrames:
            continue
        
        # Count how many distractors are active at this frame
        active_count = 0
        for distractor in random_distractors:
            start = distractor['startFrame']
            end = start + len(distractor['step_data'])
            if start <= frame < end:
                active_count += 1
        
        # Skip spawning if we've reached the maximum
        if active_count >= maxActive:
            continue
        
        if np.random.random() < probability:
            # Try to find a valid spawn location
            max_attempts = 50
            valid_location = False
            
            for _ in range(max_attempts):
                # Random position
                spawn_x = np.random.uniform(radius, worldWidth - radius)
                spawn_y = np.random.uniform(radius, worldHeight - radius)
                
                # Check if position is valid (doesn't intersect with barriers, sensors, or target)
                valid = True
                
                # Check barriers
                for barrier in sim_data['barriers']:
                    if (spawn_x + radius > barrier['x'] and spawn_x - radius < barrier['x'] + barrier['width'] and
                        spawn_y + radius > barrier['y'] and spawn_y - radius < barrier['y'] + barrier['height']):
                        valid = False
                        break
                
                # Check sensors
                if valid and 'red_sensor' in sim_data:
                    sensor = sim_data['red_sensor']
                    if (spawn_x + radius > sensor['x'] and spawn_x - radius < sensor['x'] + sensor['width'] and
                        spawn_y + radius > sensor['y'] and spawn_y - radius < sensor['y'] + sensor['height']):
                        valid = False
                
                if valid and 'green_sensor' in sim_data:
                    sensor = sim_data['green_sensor']
                    if (spawn_x + radius > sensor['x'] and spawn_x - radius < sensor['x'] + sensor['width'] and
                        spawn_y + radius > sensor['y'] and spawn_y - radius < sensor['y'] + sensor['height']):
                        valid = False
                
                # Check target position at this frame
                if valid and frame in sim_data['step_data']:
                    target_data = sim_data['step_data'][frame]
                    target_x = target_data['x'] + radius
                    target_y = target_data['y'] + radius
                    if check_collision_with_ball(spawn_x, spawn_y, radius, target_x, target_y, radius):
                        valid = False
                
                if valid:
                    valid_location = True
                    break
            
            if not valid_location:
                continue  # Skip this frame if no valid location found
            
            # Random direction (uniform)
            direction = np.random.uniform(-np.pi, np.pi)
            
            # Simulate this random distractor
            distractor_data = simulate_key_distractor(
                {
                    'startFrame': frame,
                    'x': spawn_x,
                    'y': spawn_y,
                    'direction': direction,
                    'duration': duration,
                    'speed': ballSpeed  # Random distractors use the same speed as main ball
                },
                sim_data,
                worldWidth,
                worldHeight,
                TIMESTEP,
                FRAME_INTERVAL,
                FPS,
                ballSpeed,
                elasticity,
                friction,
                space
            )
            
            random_distractors.append(distractor_data)
            # print(f"Random distractor spawned at frame {frame}")
    
    return random_distractors

# Convert entities to Pymunk bodies and run simulation
def run_simulation_with_visualization(entities, simulationParams, distractorParams=None):
    videoLength, ballSpeed, fps, physicsStepsPerFrame, res_multiplier, timestep, worldWidth, worldHeight = simulationParams

    # Calculate derived values
    numFrames = int(videoLength * fps)
    FRAME_INTERVAL = physicsStepsPerFrame
    TIMESTEP = timestep
    print(f"TIMESTEP: {TIMESTEP}")
    print(f"FRAME_INTERVAL: {FRAME_INTERVAL}")
    FPS = fps

    sim_data = {
        'barriers': [], 
        'occluders': [], 
        'step_data': {}, 
        'rg_hit_timestep': -1, 
        'rg_outcome': None,
        'key_distractors': [],
        'random_distractors': []
    }

    # Pymunk simulation constants
    GRAVITY = (0, 0)  # Example gravity vector
    interval = 0.1/res_multiplier  # Pixels in the 2D visualization space
    friction = 0.0
    elasticity = 1.0
    sim_data['scene_dims'] = (worldWidth, worldHeight)
    sim_data['interval'] = interval
    sim_data['friction'] = friction
    sim_data['elasticity'] = elasticity
    sim_data['timestep'] = TIMESTEP
    sim_data['timesteps_per_frame'] = FRAME_INTERVAL
    sim_data['num_frames'] = numFrames
    sim_data['fps'] = FPS
    SPACE_SIZE_width = worldWidth * int(1/interval)
    SPACE_SIZE_height = worldHeight * int(1/interval)
    pix_x = np.arange(0, worldWidth, interval)
    pix_y = np.arange(0, worldHeight, interval)
    y_vals, x_vals = np.meshgrid(pix_x, pix_y, indexing='ij')
    y_vals = np.flip(y_vals)

    # Initialize Pymunk space
    space = pymunk.Space()

    static_body = space.static_body
    walls = [
        pymunk.Segment(static_body, (0, 0), (worldWidth, 0), 0.01),  # Bottom
        pymunk.Segment(static_body, (0, 0), (0, worldHeight), 0.01),  # Left
        pymunk.Segment(static_body, (worldWidth, 0), (worldWidth, worldHeight), 0.01),  # Right
        pymunk.Segment(static_body, (0, worldHeight), (worldWidth, worldHeight), 0.01),  # Top
    ]
    for wall in walls:
        wall.elasticity = elasticity
        wall.friction = friction
        space.add(wall)


    space.gravity = GRAVITY

    # Map for storing Pymunk bodies and shapes
    body_map = {}

    # Add entities as Pymunk bodies and shapes
    for entity in entities:
        valid_physics_entity = False
        x, y, width, height = entity["x"], entity["y"], entity["width"], entity["height"]
        if entity["type"] == "target":
            valid_physics_entity = True
            direction = entity['direction']
            # The ball speed is controlled by physics parameters (timestep and physicsStepsPerFrame)
            # not by the initial velocity magnitude
            vx, vy = np.cos(direction), np.sin(direction)
            # Circle for the target
            radius = width / 2
            mass = 1.0  # Assign a reasonable mass
            moment = pymunk.moment_for_circle(mass, 0, radius)  # Calculate moment of inertia
            body = pymunk.Body(mass, moment, body_type=pymunk.Body.DYNAMIC)
            body.position = (x + radius, y + radius)
            body.velocity = (vx, vy)
            shape = pymunk.Circle(body, radius)
            sim_data['target'] = {'size' : width, 'shape' : 1} # 0 for square and 1 for circle
        elif entity["type"] == "barrier":
            valid_physics_entity = True
            # Rectangles for other entities
            body = pymunk.Body(body_type=pymunk.Body.STATIC)
            body.position = (x + width / 2, y + height / 2)
            shape = pymunk.Poly.create_box(body, (width, height))
            sim_data['barriers'].append({'x' : x,
                                        'y' : y,
                                        'width' : width,
                                        'height' : height})
        elif entity["type"] == 'occluder':
            sim_data['occluders'].append({'x' : x,
                                        'y' : y,
                                        'width' : width,
                                        'height' : height})
        elif entity["type"] == 'green_sensor':
            sim_data['green_sensor'] = {'x' : x,
                                        'y' : y,
                                        'width' : width,
                                        'height' : height}
        elif entity["type"] == 'red_sensor':
            sim_data['red_sensor'] = {'x' : x,
                                        'y' : y,
                                        'width' : width,
                                        'height' : height}
        if valid_physics_entity:
            # Add shape to space
            shape.elasticity = elasticity  # Example elasticity
            shape.friction = friction  # Example friction
            space.add(body, shape)
            body_map[entity["id"]] = (body, shape)

    sim_data['num_barriers'] = len(sim_data['barriers'])
    sim_data['num_occs'] = len(sim_data['occluders'])

    has_hit_red_green = False

    # Simulate for the given number of frames
    for frame in tqdm(range(numFrames)):
        if frame != 0:
            for _ in range(FRAME_INTERVAL):
                space.step(TIMESTEP)

        # frame_data = frame_data_template.copy()
        # Draw the entities in the frame
        for entity in entities:
            if entity['id'] in list(body_map.keys()):
                body, shape = body_map[entity["id"]]
                if isinstance(shape, pymunk.Circle):
                    r = shape.radius
                    tx, ty  = body.position.x - r, body.position.y - r
                    vx, vy  = body.velocity.x, body.velocity.y
                    # Scale velocity by ballSpeed to reflect actual speed in diameters/second
                    # The physics simulation uses normalized velocities (magnitude 1), but we want
                    # to save the actual speed values
                    vx_scaled = vx * ballSpeed
                    vy_scaled = vy * ballSpeed
                    speed = np.sqrt(vx_scaled**2 + vy_scaled**2)
                    direction = np.atan2(vy_scaled, vx_scaled)
                    # x_vals_discrete = np.arange(0, worldWidth, interval)
                    # y_vals_discrete = np.arange(0, worldHeight, interval)
                    
                    # x = x_vals_discrete[np.argmin(np.abs(x_vals_discrete - body.position.x))]
                    # y = y_vals_discrete[np.argmin(np.abs(y_vals_discrete - body.position.y))]
                    target_mask = np.square(x_vals + interval/2 - (tx + r)) + np.square(y_vals + interval/2 - (ty + r)) <= np.square(r)
                    # save to metadata
                    sim_data['step_data'][frame] = { # overspecified
                        'x' : tx,
                        'y' : ty,
                        'speed' : speed,
                        'dir' : direction,
                        'vx' : vx_scaled,
                        'vy' : vy_scaled
                    }

        # NOTE: NEED TO PROCESS THIS IN RED AND IN GREEN!!!!!
        if 'red_sensor' in sim_data or 'green_sensor' in sim_data:
            if 'red_sensor' in sim_data:
                radius = sim_data['target']['size'] / 2
                center_x = tx + radius
                center_y = ty + radius
                red_sensor = sim_data['red_sensor']
                # Check if circle overlaps with rectangle
                closest_x = max(red_sensor['x'], min(center_x, red_sensor['x'] + red_sensor['width']))
                closest_y = max(red_sensor['y'], min(center_y, red_sensor['y'] + red_sensor['height']))
                distance_sq = (center_x - closest_x)**2 + (center_y - closest_y)**2
                in_red = distance_sq <= radius**2
            else:
                in_red = False
            if 'green_sensor' in sim_data:
                radius = sim_data['target']['size'] / 2
                center_x = tx + radius
                center_y = ty + radius
                green_sensor = sim_data['green_sensor']
                # Check if circle overlaps with rectangle
                closest_x = max(green_sensor['x'], min(center_x, green_sensor['x'] + green_sensor['width']))
                closest_y = max(green_sensor['y'], min(center_y, green_sensor['y'] + green_sensor['height']))
                distance_sq = (center_x - closest_x)**2 + (center_y - closest_y)**2
                in_green = distance_sq <= radius**2
            else:
                in_green = False
        else:
            in_red = False
            in_green = False

        if not has_hit_red_green:
            if in_red:
                sim_data['rg_outcome'] = 'red'
                has_hit_red_green = True
                sim_data['rg_hit_timestep'] = frame
            elif in_green:
                sim_data['rg_outcome'] = 'green'
                has_hit_red_green = True
                sim_data['rg_hit_timestep'] = frame

        if has_hit_red_green:
            break

    sim_data['num_frames'] = frame+1 # this cannot be frames, because ball may hit red or green before the 
    
    # Process distractors if provided
    if distractorParams:
        print("Processing distractors...")
        
        # Process key distractors
        keyDistractors = distractorParams.get('keyDistractors', [])
        for i, keyDistractor in enumerate(keyDistractors):
            print(f"Processing key distractor {i+1}/{len(keyDistractors)}")
            distractor_data = simulate_key_distractor(
                keyDistractor, 
                sim_data, 
                worldWidth, 
                worldHeight,
                TIMESTEP,
                FRAME_INTERVAL,
                FPS,
                ballSpeed,
                elasticity,
                friction,
                space  # Reuse the space for collision detection with barriers
            )
            sim_data['key_distractors'].append(distractor_data)
        
        # Process random distractors
        randomParams = distractorParams.get('randomDistractorParams', {})
        if randomParams and randomParams.get('probability', 0) > 0:
            print("Generating random distractors...")
            random_distractors = generate_random_distractors(
                randomParams,
                sim_data,
                worldWidth,
                worldHeight,
                TIMESTEP,
                FRAME_INTERVAL,
                FPS,
                ballSpeed,
                elasticity,
                friction,
                space
            )
            sim_data['random_distractors'] = random_distractors
    
    return sim_data

def get_high_res_obs_array(sim_data):

    # params
    interval = 0.02
    worldWidth = 20
    worldHeight = 20
    SPACE_SIZE_width = worldWidth * int(1/interval)
    SPACE_SIZE_height = worldHeight * int(1/interval)
    pix_x = np.arange(0, worldWidth, interval)
    pix_y = np.arange(0, worldHeight, interval)
    y_vals, x_vals = np.meshgrid(pix_x, pix_y, indexing='ij')
    y_vals = np.flip(y_vals)

    # Initialize the 3D NumPy array for visualization
    high_res_obs_array = np.zeros((sim_data['num_frames'], SPACE_SIZE_height, SPACE_SIZE_width, 3), dtype=np.uint8)

    frame_data_template = np.ones((SPACE_SIZE_height, SPACE_SIZE_width, 3), dtype=np.uint8) * 255  # Add color channels
    # add red, green, barriers then occs

    if 'green_sensor' in sim_data:
        green_sensor = sim_data['green_sensor']
        x, y, width, height = list(green_sensor.values())
        mask = np.all(
            np.array([
                x_vals >= x,
                y_vals >= y,
                x_vals < x + width,
                y_vals < y + height
            ]), axis = 0
        )
        frame_data_template[mask] = [0, 255, 0]

    if 'red_sensor' in sim_data:
        red_sensor = sim_data['red_sensor']
        x, y, width, height = list(red_sensor.values())
        mask = np.all(
            np.array([
                x_vals >= x,
                y_vals >= y,
                x_vals < x + width,
                y_vals < y + height
            ]), axis = 0
        )
        frame_data_template[mask] = [255, 0, 0]

    # get occ_masks
    occ_masks = []
    for occluder in sim_data['occluders']:
        x, y, width, height = list(occluder.values())
        mask = np.all(
            np.array([
                x_vals >= x,
                y_vals >= y,
                x_vals < x + width,
                y_vals < y + height
            ]), axis = 0
        )
        occ_masks.append(mask)

    for barrier in sim_data['barriers']:
        x, y, width, height = list(barrier.values())
        mask = np.all(
            np.array([
                x_vals >= x,
                y_vals >= y,
                x_vals < x + width,
                y_vals < y + height
            ]), axis = 0
        )
        frame_data_template[mask] = [0, 0, 0]

    # Simulate for the given number of frames
    for frame in tqdm(range(sim_data['num_frames'])):

        frame_data = frame_data_template.copy()
        if frame in sim_data['step_data']:
            target_data = sim_data['step_data'][frame]
            x, y  = target_data['x'], target_data['y']
            r = sim_data['target']['size']/2
            target_mask = np.square(x_vals + interval/2 - (x + r)) + np.square(y_vals + interval/2 - (y + r)) <= np.square(r)
            frame_data[target_mask] = [0, 0, 255]

        for occ_mask in occ_masks:
            frame_data[occ_mask] = [128, 128, 128]
        # Store the frame in the visualization data
        high_res_obs_array[frame] = frame_data

    return high_res_obs_array

@app.route("/")
def index():
    """
    Serve the React index.html file.
    """
    try:
        return send_from_directory(build_path, "index.html")
    except Exception as e:
        print(f"Error serving index.html: {e}")
        return "React app not found", 500

@app.route("/<path:path>")
def serve_static_files(path):
    """
    Serve static files such as JS, CSS, and assets.
    First checks build folder, then assets folder, then falls back to index.html for React Router.
    """
    # First check build folder
    build_file_path = os.path.join(build_path, path)
    if os.path.exists(build_file_path):
        return send_from_directory(build_path, path)
    
    # Note: site_static_assets are now served from AWS S3, not locally
    # Only serve root assets folder (for favicon, robots.txt, etc.)
    assets_file_path = os.path.join(assets_path, path)
    if os.path.exists(assets_file_path):
        return send_from_directory(assets_path, path)
    
    # Fall back to index.html for React Router paths
    try:
        return send_from_directory(build_path, "index.html")
    except Exception as e:
        print(f"Error serving static file {path}: {e}")
        return "File not found", 404

@app.route("/simulate", methods=["POST"])
def simulate():
    print("simulate activated")
    try:
        print("Running physics")
        data = request.json
        entities = data.get("entities", [])
        simulationParams = data.get("simulationParams", [])
        distractorParams = data.get("distractorParams", None)  # Optional distractor params
        simulationParams = list(simulationParams.values())
        
        # Run the Pymunk simulation
        sim_data = run_simulation_with_visualization(entities, simulationParams, distractorParams)
        
        global GLOBAL_SIM_DATA
        GLOBAL_SIM_DATA = copy.deepcopy(sim_data)

        print("physics done")

        return jsonify({"status": "success", "sim_data": sim_data})
    except Exception as e:
        print("Error during simulation:", e)
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/clear_simulation', methods=['POST'])
def clear_simulation():
    # Add logic here to clear the simulation state on the server
    global GLOBAL_SIM_DATA
    GLOBAL_SIM_DATA = None
    print("Simulation cleared successfully.")
    return jsonify({"status": "success", "message": "Simulation cleared."})

@app.route('/metrics_csv', methods=['GET'])
def get_metrics_csv():
    """
    Proxy endpoint to fetch metrics CSV from AWS S3.
    This avoids CORS issues when fetching directly from the frontend.
    
    Query parameters:
    - diameter: Optional. If provided, fetches from varying_diameters/diameter_{diameter}/cogsci_2025_trials/per_trial_metrics.csv
    - asset_folder: Optional. If provided and diameter is not set, fetches from site_static_assets/{asset_folder}/per_trial_metrics.csv
    - Otherwise, fetches from cogsci_2025_trials_tuned_Jan102026/per_trial_metrics.csv
    """
    try:
        diameter = request.args.get('diameter')
        asset_folder = request.args.get('asset_folder')
        
        if diameter:
            # Fetch from diameter-specific folder (CSV is in cogsci_2025_trials subfolder)
            csv_url = f'https://redgreenplayground.s3.us-east-2.amazonaws.com/site_static_assets/varying_diameters/diameter_{diameter}/cogsci_2025_trials/per_trial_metrics.csv'
        elif asset_folder:
            csv_url = f'https://redgreenplayground.s3.us-east-2.amazonaws.com/site_static_assets/{asset_folder}/per_trial_metrics.csv'
        else:
            # Default: fetch from cogsci_2025_trials_tuned_Jan102026
            csv_url = 'https://redgreenplayground.s3.us-east-2.amazonaws.com/site_static_assets/cogsci_2025_trials_tuned_Jan102026/per_trial_metrics.csv'
        
        response = requests.get(csv_url, timeout=10)
        response.raise_for_status()
        
        return response.text, 200, {'Content-Type': 'text/csv; charset=utf-8'}
    except requests.exceptions.RequestException as e:
        print(f"Error fetching CSV from S3: {e}")
        return jsonify({"error": f"Failed to fetch CSV: {str(e)}"}), 500

@app.route('/convert_to_mp4', methods=['POST'])
def convert_to_mp4():
    """
    Convert WebM video to MP4 using FFmpeg.
    Expects a multipart/form-data request with a 'video' file field.
    Returns the MP4 file as a download.
    """
    try:
        if 'video' not in request.files:
            return jsonify({"status": "error", "message": "No video file provided"}), 400
        
        webm_file = request.files['video']
        if webm_file.filename == '':
            return jsonify({"status": "error", "message": "No file selected"}), 400
        
        # Create temporary files for input and output
        # Stream file to disk in chunks to avoid loading entire file into memory
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_webm:
            webm_path = temp_webm.name
            # Stream in chunks to reduce memory usage
            chunk_size = 8192  # 8KB chunks
            while True:
                chunk = webm_file.stream.read(chunk_size)
                if not chunk:
                    break
                temp_webm.write(chunk)
            temp_webm.flush()
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_mp4:
            mp4_path = temp_mp4.name
        
        try:
            # Check if FFmpeg is available
            subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            # Clean up temp files
            os.unlink(webm_path)
            os.unlink(mp4_path)
            return jsonify({
                "status": "error", 
                "message": "FFmpeg is not installed or not available in PATH. Please install FFmpeg to use MP4 conversion."
            }), 500
        
        # Convert WebM to MP4 using FFmpeg
        # Using H.264 codec with memory-efficient settings for Heroku
        ffmpeg_cmd = [
            'ffmpeg',
            '-i', webm_path,  # Input file
            '-c:v', 'libx264',  # Video codec (H.264)
            '-preset', 'ultrafast',  # Fastest preset (uses less memory than medium)
            '-crf', '23',  # Quality (18-28 range, lower = better quality)
            '-pix_fmt', 'yuv420p',  # Pixel format for compatibility
            '-movflags', '+faststart',  # Optimize for web streaming
            '-threads', '1',  # Limit to single thread to reduce memory usage
            '-max_muxing_queue_size', '1024',  # Limit muxing queue size
            '-y',  # Overwrite output file
            mp4_path  # Output file
        ]
        
        result = subprocess.run(
            ffmpeg_cmd,
            capture_output=True,
            text=True
        )
        
        # Clean up input file
        os.unlink(webm_path)
        
        if result.returncode != 0:
            # Clean up output file on error
            if os.path.exists(mp4_path):
                os.unlink(mp4_path)
            print(f"FFmpeg error: {result.stderr}")
            return jsonify({
                "status": "error",
                "message": f"FFmpeg conversion failed: {result.stderr[:200]}"
            }), 500
        
        # Send the MP4 file
        return send_file(
            mp4_path,
            mimetype='video/mp4',
            as_attachment=True,
            download_name=webm_file.filename.replace('.webm', '.mp4')
        )
        
    except Exception as e:
        # Clean up temp files on error
        if 'webm_path' in locals() and os.path.exists(webm_path):
            os.unlink(webm_path)
        if 'mp4_path' in locals() and os.path.exists(mp4_path):
            os.unlink(mp4_path)
        
        print(f"Error converting video: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": f"Conversion error: {str(e)}"
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
