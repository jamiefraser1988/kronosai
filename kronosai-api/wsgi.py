import sys
import os

from app import app as application  # Import your Flask app here

# Add your project directory to the sys.path
sys.path.insert(0, os.path.dirname(__file__))
