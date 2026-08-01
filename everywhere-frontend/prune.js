const ts = require('typescript');
const fs = require('fs');

const file = 'src/app/pages/cotizaciones/cotizaciones.component.ts';
let sourceCode = fs.readFileSync(file, 'utf8');

const propertiesToDelete = [
  'mostrarFormulario', 'editandoCotizacion', 'mostrarGestionGrupos',
  'grupoSeleccionadoId', 'cotizacionOriginal', 'cotizacionForm',
  'detalleForm', 'detalleGrupoForm', 'grupoHotelForm', 'nuevaCategoriaForm',
  'detallesFijos', 'gruposHoteles', 'deletedDetalleIds', 'creandoCategoria',
  'categoriaEditandose', 'categoriaDatosOriginales'
];

const methodsToDelete = [
  'mostrarFormularioEditar', 'editarDesdeModa', 'cerrarFormulario', 'calcularTotalDetalle',
  'calcularTotalDetalleGrupo', 'agregarDetalleFijo', 'eliminarDetalleFijo', 'onProductoChange',
  'recalcularTotalDetalle', 'onGrupoProductoChange', 'recalcularTotalDetalleGrupo',
  'undoEliminarDetalle', 'crearGrupoHotel', 'eliminarGrupoHotel', 'mostrarVistaGestionGrupos',
  'cerrarVistaGestionGrupos', 'seleccionarGrupoUnico', 'isGrupoSeleccionado',
  'getGrupoSeleccionado', 'getDetallesGrupoSeleccionado', 'seleccionarDetalleGrupo',
  'obtenerDetallesSeleccionados', 'obtenerEstadoSeleccion', 'deseleccionarTodos',
  'trackByGrupoId', 'contarDetallesSeleccionados', 'guardarSelecciones', 'getTotalOpcionesGrupos',
  'duplicarGrupoHotel', 'duplicarDetalleGrupo', 'limpiarTodosLosGrupos', 'exportarGrupos',
  'crearNuevaCategoria', 'limpiarFormularioNuevaCategoria', 'editarCategoria',
  'guardarEdicionCategoria', 'cancelarEdicionCategoria', 'confirmarEliminarCategoria',
  'eliminarCategoria', 'contarCategoriasActivas', 'esCategoriaActiva', 'formatearFecha',
  'agregarDetalleAGrupo', 'eliminarDetalleDeGrupo', 'calcularTotalFijos', 'calcularTotalGrupos',
  'calcularCotizacionEconomica', 'onSubmitCotizacion', 'prepareCotizacionData', 'saveCotizacion',
  'updateCotizacion', 'validateForms', 'showFormErrors', 'markFormGroupTouched', 'setupDatesForNew',
  'generateNextCode', 'loadDetallesFromCotizacionCompleta', 'populateFormFromCotizacionCompleta',
  'determinarGrupoSeleccionado', 'addDetalleToGrupoHotel', 'buildPatchPayload', 'sanitizePatchPayload',
  'getGrupoSeleccionadoEnVisualizacion', 'resetForm'
];

const sourceFile = ts.createSourceFile(
  'cotizaciones.component.ts',
  sourceCode,
  ts.ScriptTarget.Latest,
  true
);

const rangesToDelete = [];

function visit(node) {
  if (ts.isPropertyDeclaration(node)) {
    const name = node.name.getText();
    if (propertiesToDelete.includes(name)) {
      rangesToDelete.push({ start: node.getFullStart(), end: node.getEnd() });
    }
  } else if (ts.isMethodDeclaration(node)) {
    const name = node.name.getText();
    if (methodsToDelete.includes(name)) {
      rangesToDelete.push({ start: node.getFullStart(), end: node.getEnd() });
    }
  }
  ts.forEachChild(node, visit);
}

visit(sourceFile);

// Sort in reverse order to not mess up indices
rangesToDelete.sort((a, b) => b.start - a.start);

for (const range of rangesToDelete) {
  sourceCode = sourceCode.slice(0, range.start) + sourceCode.slice(range.end);
}

// Additional fixes:
// 1. replace `this.initializeForms();` in ngOnInit
sourceCode = sourceCode.replace(/this\.initializeForms\(\);/, `this.searchForm = this.fb.group({ searchTerm: [''] });`);
// 2. remove initializeForms method (it's hard to match exact name in previous pass if we didn't add it)
sourceCode = sourceCode.replace(/  private initializeForms\(\)[\s\S]*?  \}/, '');
// 3. remove this.cotizacionForm.patchValue in resetClienteSeleccionado & seleccionarCliente
sourceCode = sourceCode.replace(/this\.cotizacionForm\.patchValue\(\{[^}]+\}\);/g, '');
// 4. replace isGrupoSeleccionadoEnVisualizacion body
sourceCode = sourceCode.replace(/isGrupoSeleccionadoEnVisualizacion[\s\S]*?  \}/, 'isGrupoSeleccionadoEnVisualizacion(grupoIndex: number): boolean {\n    const categorias = this.getCategoriasNoFijas();\n    if (grupoIndex >= 0 && grupoIndex < categorias.length) {\n      const categoria = categorias[grupoIndex];\n      return categoria.detalles.some((d: any) => d.seleccionado);\n    }\n    return false;\n  }');

fs.writeFileSync(file, sourceCode);
console.log('Pruning done via AST!');
