import re
import os

dc_ts_path = "src/app/pages/documento-cobranza/documento-cobranza.component.ts"
dc_html_path = "src/app/pages/documento-cobranza/documento-cobranza.component.html"
recibo_ts_path = "src/app/pages/recibo/recibo.component.ts"
recibo_html_path = "src/app/pages/recibo/recibo.component.html"

with open(dc_ts_path, 'r', encoding='utf-8') as f:
    ts_content = f.read()

with open(dc_html_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

# Replacements for TS
ts = ts_content
ts = ts.replace("app-documento-cobranza", "app-recibo")
ts = ts.replace("DocumentoCobranzaComponent", "ReciboComponent")
ts = ts.replace("DocumentoCobranzaService", "ReciboService")
ts = ts.replace("documentoCobranzaService", "reciboService")
ts = ts.replace("DocumentoCobranzaTabla", "ReciboTabla")
ts = ts.replace("DocumentoCobranzaResponseDTO", "ReciboResponseDTO")
ts = ts.replace("getDocumentosCobranzaPage", "getRecibosPage")
ts = ts.replace("createDocumentoCobranza", "createRecibo")
ts = ts.replace("documentoCobranza.component.html", "recibo.component.html")
ts = ts.replace("documentoCobranza.component.css", "recibo.component.css")
ts = ts.replace("collection-documents", "receipts")
ts = ts.replace("documentos de cobranza", "recibos")
ts = ts.replace("Documento de cobranza", "Recibo")
ts = ts.replace("documento de cobranza", "recibo")
ts = ts.replace("Documentos de Cobranza", "Recibos")
ts = ts.replace("Documento de Cobranza", "Recibo")
ts = ts.replace("documentos", "recibos")
ts = ts.replace("Documentos", "Recibos")
ts = ts.replace("documento", "recibo")
ts = ts.replace("Documento", "Recibo")
# Fix any capitalization or duplicate replacements
ts = ts.replace("recibosTabla", "recibosTabla") # just in case
ts = ts.replace("reciboOriginal", "reciboOriginal")
ts = ts.replace("getNumeroRecibo", "getNumeroRecibo")
ts = ts.replace("reciboSeleccionado", "reciboSeleccionado")
ts = ts.replace("../../shared/models/Recibo/recibo.model", "../../shared/models/Recibo/recibo.model")

# Fix imports since we replaced everything containing 'Documento' to 'Recibo'
ts = ts.replace("../../core/service/ReciboCobranza/ReciboCobranza.service", "../../core/service/Recibo/recibo.service")
ts = ts.replace("../../core/service/Recibo/Recibo.service", "../../core/service/Recibo/recibo.service")

# Replacements for HTML
html = html_content
html = html.replace("Documentos de Cobranza", "Recibos")
html = html.replace("Documento de Cobranza", "Recibo")
html = html.replace("documentos de cobranza", "recibos")
html = html.replace("documento de cobranza", "recibo")
html = html.replace("documento", "recibo")
html = html.replace("Documento", "Recibo")
html = html.replace("documentos", "recibos")
html = html.replace("Documentos", "Recibos")

with open(recibo_ts_path, 'w', encoding='utf-8') as f:
    f.write(ts)

with open(recibo_html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Replacement complete")
