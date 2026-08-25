import os
import shutil
import base64

# Paths for source and target
source_dir = r"C:\Users\aayus\OneDrive\Projects\P1"  # Target directory is also workspace root
# Actually, the original images were saved in the brain directory, so let's keep source_dir pointing to the brain directory
source_dir = r"C:\Users\aayus\.gemini\antigravity-ide\brain\2b96564f-6604-4b56-b1d8-a6bb1f27c624"
target_dir = r"c:\Users\aayus\OneDrive\Projects\P1\assets"
samples_js_path = r"c:\Users\aayus\OneDrive\Projects\P1\samples.js"

files = {
    "mountain_sample_1783154054177.png": "mountain.png",
    "robot_sample_1783154066832.png": "robot.png",
    "cat_sample_1783154079533.png": "cat.png"
}

# Create assets directory if it doesn't exist
os.makedirs(target_dir, exist_ok=True)

samples_base64 = {}

# Copy each generated sample image and read base64
for src_name, target_name in files.items():
    src_path = os.path.join(source_dir, src_name)
    target_path = os.path.join(target_dir, target_name)
    
    if os.path.exists(src_path):
        # Copy file
        shutil.copy(src_path, target_path)
        print(f"Copied {src_name} to {target_name}")
        
        # Read and convert to base64
        with open(src_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
            key = target_name.split('.')[0]
            samples_base64[key] = f"data:image/png;base64,{encoded_string}"
    else:
        print(f"Source file not found: {src_path}")

# Write samples.js as a global window object script (safe for file:// loading)
if samples_base64:
    with open(samples_js_path, "w") as js_file:
        js_file.write("// Global base64 encoded sample images\n")
        js_file.write("window.sampleData = {\n")
        for key, val in samples_base64.items():
            js_file.write(f"  {key}: \"{val}\",\n")
        js_file.write("};\n")
    print(f"Generated samples.js at {samples_js_path}")
else:
    print("No sample images were found to encode.")
