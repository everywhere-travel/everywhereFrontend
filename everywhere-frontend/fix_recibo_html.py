import re

ts_path = 'src/app/pages/recibo/recibo.component.ts'
html_path = 'src/app/pages/recibo/recibo.component.html'

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Reemplazar el main tag por la tabla
new_main = '''    <main class="max-w-full mx-auto px-6 py-6">
      <app-data-table 
        [config]="tableConfig" 
        [isLoading]="loading"
        (pageChange)="onPageChange()"
        (sortChange)="onSortChange()"
        (searchChange)="onSearchChange()">
      </app-data-table>
    </main>'''

html = re.sub(r'<main class="max-w-full mx-auto px-6 py-6">.*?</main>', new_main, html, flags=re.DOTALL)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print('HTML updated!')
