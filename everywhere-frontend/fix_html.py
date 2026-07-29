import re

html_path = 'src/app/pages/recibo/recibo.component.html'
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the TH checkbox
content = re.sub(r'<th class="w-12 p-5 text-center">\s*<label class="relative inline-block cursor-pointer">.*?</label>\s*</th>', '', content, flags=re.DOTALL)

# Remove the TD checkbox
content = re.sub(r'<!-- Checkbox -->\s*<td class="p5 text-center">\s*<label class="relative inline-block cursor-pointer">.*?</label>\s*</td>', '', content, flags=re.DOTALL)

# Remove the other checkboxes in cards and list view
content = re.sub(r'<input type="checkbox" \[checked\]="isSelected\(recibo\.id\)" \(change\)="toggleSelection\(recibo\.id\)"\s*class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />', '', content)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

detalle_path = 'src/app/pages/detalle-recibo/detalle-recibo.component.html'
with open(detalle_path, 'r', encoding='utf-8') as f:
    detalle_content = f.read()

# Fix textarea height
detalle_content = detalle_content.replace('resize-y min-h-[38px] max-h-[200px]', 'h-[38px] resize-y overflow-hidden max-h-[100px]')

with open(detalle_path, 'w', encoding='utf-8') as f:
    f.write(detalle_content)

print('Done HTML cleanups')
