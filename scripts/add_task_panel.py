import re

# Read index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add Task Status Tab
tab_find = '<div class="bottom-tab" data-tab="find">Find Results</div>'
tab_replace = '<div class="bottom-tab" data-tab="find">Find Results</div>\n                <div class="bottom-tab" data-tab="task-status">Task Status</div>'

if tab_find in html:
    html = html.replace(tab_find, tab_replace)
    print("Added Task Status tab")
else:
    print("Could not find location for Task Status tab")

# 2. Add Task Status Content
content_find = '<div id="compiler-results" class="panel-content">'
content_replace = '''<div id="task-status-content" class="panel-content" style="display: none;">
                <div style="padding: 10px;">
                    <h3 id="task-title" style="margin-top: 0; color: #fff;">No Active Task</h3>
                    <p id="task-desc" style="color: #aaa; margin-bottom: 15px;">Select a task from the toolbar to begin.</p>
                    <div id="task-requirements"></div>
                </div>
            </div>
            <div id="compiler-results" class="panel-content">'''

if content_find in html:
    html = html.replace(content_find, content_replace)
    print("Added Task Status content panel")
else:
    print("Could not find location for Task Status content")

# Write back
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated index.html with Task UI elements")
