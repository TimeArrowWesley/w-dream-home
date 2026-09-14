"""Rebuild the current reassessment; the old long-pendant proposal is withdrawn."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name("build-speaker-reassessment.py")),run_name="__main__")
