import sys

with open('/src/data/dictionary.ts', 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    # Check if this line looks like a dictionary entry missing a comma
    stripped = line.strip()
    if stripped.startswith('{') and stripped.endswith('}') and not stripped.endswith('},'):
        # Check if next line starts with {
        if i + 1 < len(lines) and lines[i+1].strip().startswith('{'):
            line = line.replace('}', '},')
    new_lines.append(line)

with open('/src/data/dictionary.ts', 'w') as f:
    f.writelines(new_lines)
