import urllib.request
import tarfile
import os
import subprocess
import shutil

url = "https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.19.12.tgz"
filename = "esbuild.tgz"

urllib.request.urlretrieve(url, filename)
with tarfile.open(filename, "r:gz") as tar:
    tar.extractall("esbuild_temp")

exe_path = os.path.join("esbuild_temp", "package", "esbuild.exe")
dest_exe = "esbuild.exe"
shutil.move(exe_path, dest_exe)

subprocess.run([dest_exe, "src/index.js", "--bundle", "--outfile=bundle.js"])

os.remove(filename)
shutil.rmtree("esbuild_temp")
os.remove(dest_exe)
