import struct

def get_image_size(file_path):
    with open(file_path, 'rb') as f:
        f.read(16)
        width, height = struct.unpack('>LL', f.read(8))
        return width, height

print(get_image_size('../frontend/public/logo.png'))
