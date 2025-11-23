# Fix HTML to add task-selector
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Look for the exact location with proper line endings
find_text = '                <button id="help-btn" title="Help (F1)"><i class="fas fa-question-circle"></i> Help</button>\r\n            </div>\r\n        </div>'

replace_text = '''                <button id="help-btn" title="Help (F1)"><i class="fas fa-question-circle"></i> Help</button>
            </div>
            <div class="group">
                <label for="task-selector" style="color: #ccc; margin-right: 8px; font-size: 12px;">Task:</label>
                <select id="task-selector" style="background: #2a2a2a; color: #ccc; border: 1px solid #444; padding: 4px 8px; border-radius: 2px; min-width: 200px;">
                    <option value="">Select Task...</option>
                </select>
            </div>
        </div>'''

if find_text in html:
    html = html.replace(find_text, replace_text)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Successfully added task-selector to index.html")
else:
    print("Could not find exact match. Trying alternative approach...")
    # Try with Unix line endings
    find_text2 = '                <button id="help-btn" title="Help (F1)"><i class="fas fa-question-circle"></i> Help</button>\n            </div>\n        </div>'
    if find_text2 in html:
        html = html.replace(find_text2, replace_text)
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print("Successfully added task-selector to index.html (Unix)")
    else:
        print("ERROR: Could not find target location in HTML")
