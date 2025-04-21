
let originalData = null;
let processedData = null;
let charts = {};

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const manageProjectsBtn = document.getElementById('manageProjectsBtn');
    const projectsManager = document.getElementById('projectsManager');
    const saveProjectBtn = document.getElementById('saveProjectBtn');

    // Botón para mostrar/ocultar el gestor de proyectos
    manageProjectsBtn.addEventListener('click', function() {
        if (projectsManager.classList.contains('hidden')) {
            projectsManager.classList.remove('hidden');
            loadProjectsList(); // Cargar la lista de proyectos
        } else {
            projectsManager.classList.add('hidden');
        }
    });

    // Botón para guardar el proyecto actual
    saveProjectBtn.addEventListener('click', function() {
        const projectName = document.getElementById('projectName').value.trim();
        saveProject(projectName);
    });

    // Eventos de arrastrar y soltar
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.style.borderColor = '#4361ee';
        dropArea.style.backgroundColor = 'rgba(67, 97, 238, 0.1)';
    }
    
    function unhighlight() {
        dropArea.style.borderColor = '#ddd';
        dropArea.style.backgroundColor = '';
    }
    
    // Manejar el archivo soltado
    dropArea.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            processExcelFile(files[0]);
        }
    });
    
    // Manejar la selección de archivo
    selectFileBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', function() {
        if (fileInput.files.length) {
            processExcelFile(fileInput.files[0]);
        }
    });
    
    // Botón de descarga
    downloadBtn.addEventListener('click', function() {
        downloadReport();
    });
});

// Procesar archivo Excel
function processExcelFile(file) {
    const loadingSection = document.getElementById('loadingSection');
    const resultsSection = document.getElementById('resultsSection');
    
    // Mostrar spinner de carga
    loadingSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Tomar la primera hoja de trabajo
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir a JSON
        originalData = XLSX.utils.sheet_to_json(worksheet);
        
        // Añadir código incremental
        processedData = originalData.map((row, index) => {
            return {
                Código: index + 1,
                ...row
            };
        });
        
        // Actualizar UI
        setTimeout(() => {
            renderTableData();
            createCharts();
            generateAnalysis();
            
            loadingSection.classList.add('hidden');
            resultsSection.classList.remove('hidden');
        }, 1000);
    };
    
    reader.readAsArrayBuffer(file);
}

// Renderizar tabla
function renderTableData() {
    if (!processedData || processedData.length === 0) return;
    
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    
    // Limpiar tabla
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';
    
    // Obtener encabezados
    const headers = Object.keys(processedData[0]);
    
    // Añadir encabezados
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        tableHeader.appendChild(th);
    });
    
    // Añadir filas (limitadas a 10 para vista previa)
    const previewData = processedData.slice(0, 10);
    
    previewData.forEach(row => {
        const tr = document.createElement('tr');
        
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header];
            tr.appendChild(td);
        });
        
        tableBody.appendChild(tr);
    });
}

// Crear gráficos
function createCharts() {
    if (!processedData || processedData.length === 0) return;
    
    // Destruir gráficos existentes
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    
    // Datos para gráficos
    const headers = Object.keys(processedData[0]).filter(h => h !== 'Código');
    const numericColumns = headers.filter(header => 
        processedData.every(row => !isNaN(parseFloat(row[header])))
    );
    
    // 1. Gráfico de frecuencias (elegimos la primera columna numérica)
    if (numericColumns.length > 0) {
        const targetColumn = numericColumns[0];
        createFrequencyChart(targetColumn);
    }
    
    // 2. Gráfico de tendencia temporal
    createTrendChart(numericColumns);
    
    // 3. Gráfico por categorías (elegimos la primera columna no numérica)
    const categoryColumns = headers.filter(h => !numericColumns.includes(h));
    if (categoryColumns.length > 0) {
        createCategoryChart(categoryColumns[0], numericColumns[0]);
    }
    
    // 4. Gráfico de correlación (si hay al menos dos columnas numéricas)
    if (numericColumns.length >= 2) {
        createCorrelationChart(numericColumns[0], numericColumns[1]);
    }
}

// Gráfico de frecuencias
function createFrequencyChart(column) {
    const ctx = document.getElementById('frequencyChart').getContext('2d');
    
    // Crear distribución de frecuencias
    const values = processedData.map(row => parseFloat(row[column]));
    const freqMap = {};
    
    values.forEach(val => {
        freqMap[val] = (freqMap[val] || 0) + 1;
    });
    
    const sortedKeys = Object.keys(freqMap).sort((a, b) => parseFloat(a) - parseFloat(b));
    
    charts.frequency = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedKeys,
            datasets: [{
                label: `Frecuencia de ${column}`,
                data: sortedKeys.map(key => freqMap[key]),
                backgroundColor: 'rgba(67, 97, 238, 0.7)',
                borderColor: 'rgba(67, 97, 238, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: `Distribución de ${column}`
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Frecuencia'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: column
                    }
                }
            }
        }
    });
}

// Gráfico de tendencia
function createTrendChart(numericColumns) {
    if (numericColumns.length === 0) return;
    
    const ctx = document.getElementById('trendChart').getContext('2d');
    const datasets = [];
    
    // Crear un dataset para cada columna numérica (máximo 3)
    numericColumns.slice(0, 3).forEach((column, index) => {
        const colors = [
            { bg: 'rgba(67, 97, 238, 0.5)', border: 'rgba(67, 97, 238, 1)' },
            { bg: 'rgba(76, 201, 240, 0.5)', border: 'rgba(76, 201, 240, 1)' },
            { bg: 'rgba(247, 37, 133, 0.5)', border: 'rgba(247, 37, 133, 1)' }
        ];
        
        datasets.push({
            label: column,
            data: processedData.map(row => parseFloat(row[column])),
            backgroundColor: colors[index].bg,
            borderColor: colors[index].border,
            borderWidth: 2,
            tension: 0.4,
            fill: true
        });
    });
    
    charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: processedData.map(row => row['Código']),
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Tendencia de Valores'
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Valor'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Código'
                    }
                }
            }
        }
    });
}

// Gráfico por categoría
function createCategoryChart(categoryColumn, valueColumn) {
    if (!categoryColumn || !valueColumn) return;
    
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    // Agrupar por categoría
    const categoryMap = {};
    processedData.forEach(row => {
        const category = row[categoryColumn];
        const value = parseFloat(row[valueColumn]);
        
        if (!categoryMap[category]) {
            categoryMap[category] = [];
        }
        
        categoryMap[category].push(value);
    });
    
    // Calcular promedio por categoría
    const categories = Object.keys(categoryMap);
    const averages = categories.map(cat => {
        const values = categoryMap[cat];
        const sum = values.reduce((a, b) => a + b, 0);
        return sum / values.length;
    });
    
    charts.category = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: `Promedio de ${valueColumn} por ${categoryColumn}`,
                data: averages,
                backgroundColor: 'rgba(76, 201, 240, 0.7)',
                borderColor: 'rgba(76, 201, 240, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: `${valueColumn} por ${categoryColumn}`
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: `Promedio de ${valueColumn}`
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: categoryColumn
                    }
                }
            }
        }
    });
}

// Gráfico de correlación
function createCorrelationChart(column1, column2) {
    if (!column1 || !column2) return;
    
    const ctx = document.getElementById('correlationChart').getContext('2d');
    
    const data = processedData.map(row => ({
        x: parseFloat(row[column1]),
        y: parseFloat(row[column2])
    }));
    
    charts.correlation = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: `${column1} vs ${column2}`,
                data: data,
                backgroundColor: 'rgba(247, 37, 133, 0.7)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Análisis de Correlación'
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: column2
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: column1
                    }
                }
            }
        }
    });
}

// Generar análisis de resultados
function generateAnalysis() {
    if (!processedData || processedData.length === 0) return;
    
    const analysisContent = document.getElementById('analysisContent');
    const headers = Object.keys(processedData[0]).filter(h => h !== 'Código');
    
    // Identificar columnas numéricas
    const numericColumns = headers.filter(header => 
        processedData.every(row => !isNaN(parseFloat(row[header])))
    );
    
    // Generar análisis estadístico básico
    let analysis = '<h3>Resumen del Análisis</h3>';
    
    // Información general
    analysis += `<p>Se han analizado <strong>${processedData.length}</strong> registros con <strong>${headers.length}</strong> variables.</p>`;
    
    // Análisis de valores repetidos
    const valueFrequencyMap = {};
    
    numericColumns.forEach(column => {
        valueFrequencyMap[column] = {};
        
        processedData.forEach(row => {
            const value = row[column];
            valueFrequencyMap[column][value] = (valueFrequencyMap[column][value] || 0) + 1;
        });
    });
    
    // Encontrar valores más comunes
    analysis += '<h3>Valores Más Frecuentes</h3>';
    analysis += '<ul>';
    
    numericColumns.forEach(column => {
        const freqMap = valueFrequencyMap[column];
        const sortedValues = Object.keys(freqMap).sort((a, b) => freqMap[b] - freqMap[a]);
        
        if (sortedValues.length > 0) {
            const topValue = sortedValues[0];
            const frequency = freqMap[topValue];
            const percentage = ((frequency / processedData.length) * 100).toFixed(1);
            
            analysis += `<li>El valor más común en <strong>${column}</strong> es <strong>${topValue}</strong>, apareciendo <strong>${frequency}</strong> veces (${percentage}% del total).</li>`;
        }
    });
    
    analysis += '</ul>';
    
    // Tendencias identificadas
    analysis += '<h3>Tendencias Identificadas</h3>';
    
    // Análisis simple de tendencia (creciente, decreciente o estable)
    if (numericColumns.length > 0) {
        const column = numericColumns[0];
        const values = processedData.map(row => parseFloat(row[column]));
        
        // Calcular si la tendencia es creciente o decreciente
        let increasingCount = 0;
        let decreasingCount = 0;
        
        for (let i = 1; i < values.length; i++) {
            if (values[i] > values[i-1]) increasingCount++;
            else if (values[i] < values[i-1]) decreasingCount++;
        }
        
        const totalChanges = increasingCount + decreasingCount;
        
        if (totalChanges > 0) {
            const increasingPercentage = (increasingCount / totalChanges) * 100;
            
            if (increasingPercentage > 60) {
                analysis += `<p>Se observa una <strong>tendencia creciente</strong> en los valores de ${column}, con un ${increasingPercentage.toFixed(1)}% de los cambios siendo incrementos.</p>`;
            } else if (increasingPercentage < 40) {
                analysis += `<p>Se observa una <strong>tendencia decreciente</strong> en los valores de ${column}, con un ${(100 - increasingPercentage).toFixed(1)}% de los cambios siendo decrementos.</p>`;
            } else {
                analysis += `<p>Los valores de ${column} muestran una <strong>tendencia estable</strong> sin una dirección clara, con aproximadamente el mismo número de incrementos y decrementos.</p>`;
            }
        }
    }
    
    // Identificar valores atípicos
    if (numericColumns.length > 0) {
        const column = numericColumns[0];
        const values = processedData.map(row => parseFloat(row[column]));
        
        // Calcular estadísticas básicas
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        
        const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
        const variance = squaredDifferences.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        // Identificar valores atípicos (más de 2 desviaciones estándar)
        const outliers = values.filter(value => Math.abs(value - mean) > 2 * stdDev);
        
        if (outliers.length > 0) {
            const outlierPercentage = (outliers.length / values.length) * 100;
            analysis += `<p>Se identificaron <strong>${outliers.length}</strong> valores atípicos (${outlierPercentage.toFixed(1)}% del total) en ${column}, que podrían representar anomalías o oportunidades en el mercado.</p>`;
        } else {
            analysis += `<p>No se identificaron valores atípicos significativos en ${column}, lo que sugiere un comportamiento estable dentro de los rangos esperados.</p>`;
        }
    }
    
    // Conclusiones
    analysis += '<h3>Conclusiones y Recomendaciones</h3>';
    analysis += '<p>En base al análisis de los datos proporcionados, se pueden extraer las siguientes conclusiones:</p>';
    analysis += '<ul>';
    analysis += '<li>Los datos muestran patrones que podrían indicar tendencias específicas del mercado en el sector analizado.</li>';
    
    // Conclusión personalizada basada en las tendencias identificadas
    if (numericColumns.length > 0) {
        const column = numericColumns[0];
        const values = processedData.map(row => parseFloat(row[column]));
        
        // Variabilidad
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        const variabilityPercentage = (range / min) * 100;
        
        if (variabilityPercentage > 50) {
            analysis += `<li>Se observa una alta variabilidad en ${column} (${variabilityPercentage.toFixed(1)}%), lo que sugiere un mercado volátil con potenciales oportunidades para estrategias de trading activo.</li>`;
        } else if (variabilityPercentage < 20) {
            analysis += `<li>La baja variabilidad en ${column} (${variabilityPercentage.toFixed(1)}%) sugiere un mercado estable, potencialmente más adecuado para estrategias de inversión a largo plazo.</li>`;
        }
    }
    
    analysis += '<li>Se recomienda revisar periódicamente estos indicadores para identificar cambios en las tendencias del mercado.</li>';
    analysis += '<li>Para un análisis más profundo, considere incorporar más variables y datos históricos más extensos.</li>';
    analysis += '</ul>';
    
    analysisContent.innerHTML = analysis;
}

// Descargar reporte
function downloadReport() {
    const element = document.createElement('a');
    
    // Crear contenido del reporte
    let reportContent = "# Informe de Análisis de Tendencias de Mercado\n\n";
    reportContent += `Fecha: ${new Date().toLocaleDateString()}\n\n`;
    reportContent += `Total de registros analizados: ${processedData.length}\n\n`;
    
    // Añadir análisis
    reportContent += "## Análisis de Resultados\n\n";
    reportContent += document.getElementById('analysisContent').innerText;
    
    // Crear blob
    const blob = new Blob([reportContent], { type: 'text/plain' });
    
    // Descargar
    element.href = URL.createObjectURL(blob);
    element.download = `analisis_tendencias_${new Date().toTime}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Función para calcular la correlación entre dos arrays numéricos
function calculateCorrelation(array1, array2) {
    if (array1.length !== array2.length) {
        return 0;
    }
    
    const n = array1.length;
    let sum1 = 0;
    let sum2 = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;
    let pSum = 0;
    
    for (let i = 0; i < n; i++) {
        const x = array1[i];
        const y = array2[i];
        
        sum1 += x;
        sum2 += y;
        sum1Sq += x * x;
        sum2Sq += y * y;
        pSum += x * y;
    }
    
    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
    
    if (den === 0) {
        return 0;
    }
    
    return num / den;
}

//Funciones para la base de datos

// Inicializar la base de datos IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MarketAnalyzerDB', 1);
        
        request.onerror = event => {
            console.error('Error al abrir la base de datos:', event.target.error);
            reject(event.target.error);
        };
        
        request.onupgradeneeded = event => {
            const db = event.target.result;
            
            // Crear almacén para proyectos
            if (!db.objectStoreNames.contains('projects')) {
                const projectStore = db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
                projectStore.createIndex('name', 'name', { unique: false });
                projectStore.createIndex('date', 'date', { unique: false });
            }
        };
        
        request.onsuccess = event => {
            const db = event.target.result;
            resolve(db);
        };
    });
}

// Guardar proyecto actual
async function saveProject(name) {
    if (!processedData || processedData.length === 0) {
        alert('No hay datos para guardar');
        return;
    }
    
    try {
        const db = await initDB();
        const transaction = db.transaction(['projects'], 'readwrite');
        const store = transaction.objectStore('projects');
        
        // Capturar imágenes de los gráficos
        const chartImages = {};
        Object.keys(charts).forEach(key => {
            if (charts[key]) {
                chartImages[key] = charts[key].toBase64Image();
            }
        });
        
        // Crear objeto del proyecto
        const project = {
            name: name || `Proyecto ${new Date().toLocaleString()}`,
            date: new Date().toISOString(),
            originalData: originalData,
            processedData: processedData,
            charts: chartImages,
            analysis: document.getElementById('analysisContent').innerHTML
        };
        
        const request = store.add(project);
        
        request.onsuccess = () => {
            alert('Proyecto guardado correctamente');
            loadProjectsList(); // Actualizar lista de proyectos
        };
        
        request.onerror = event => {
            console.error('Error al guardar el proyecto:', event.target.error);
            alert('Error al guardar el proyecto');
        };
    } catch (error) {
        console.error('Error en saveProject:', error);
        alert('Error al guardar el proyecto');
    }
}

// Cargar lista de proyectos
async function loadProjectsList() {
    try {
        const db = await initDB();
        const transaction = db.transaction(['projects'], 'readonly');
        const store = transaction.objectStore('projects');
        const dateIndex = store.index('date');
        
        const request = dateIndex.openCursor(null, 'prev'); // Ordenar por fecha descendente
        const projectsList = document.getElementById('projectsList');
        projectsList.innerHTML = ''; // Limpiar lista
        
        request.onsuccess = event => {
            const cursor = event.target.result;
            if (cursor) {
                const project = cursor.value;
                
                // Crear elemento de lista
                const li = document.createElement('li');
                li.className = 'project-item';
                li.innerHTML = `
                    <div class="project-info">
                        <h4>${project.name}</h4>
                        <span>${new Date(project.date).toLocaleString()}</span>
                    </div>
                    <div class="project-actions">
                        <button class="btn-small load-project" data-id="${project.id}">Cargar</button>
                        <button class="btn-small delete-project" data-id="${project.id}">Eliminar</button>
                    </div>
                `;
                
                // Agregar event listeners
                li.querySelector('.load-project').addEventListener('click', () => loadProject(project.id));
                li.querySelector('.delete-project').addEventListener('click', () => deleteProject(project.id));
                
                projectsList.appendChild(li);
                cursor.continue();
            }
        };
        
        request.onerror = event => {
            console.error('Error al cargar proyectos:', event.target.error);
        };
    } catch (error) {
        console.error('Error en loadProjectsList:', error);
    }
}

// Cargar proyecto específico
async function loadProject(id) {
    try {
        const db = await initDB();
        const transaction = db.transaction(['projects'], 'readonly');
        const store = transaction.objectStore('projects');
        
        const request = store.get(id);
        
        request.onsuccess = event => {
            const project = event.target.result;
            if (project) {
                // Restaurar datos
                originalData = project.originalData;
                processedData = project.processedData;
                
                // Mostrar datos en la interfaz
                renderTableData();
                createCharts();
                
                // Restaurar análisis
                document.getElementById('analysisContent').innerHTML = project.analysis;
                
                // Mostrar sección de resultados
                document.getElementById('loadingSection').classList.add('hidden');
                document.getElementById('resultsSection').classList.remove('hidden');
                
                alert('Proyecto cargado correctamente');
            }
        };
        
        request.onerror = event => {
            console.error('Error al cargar el proyecto:', event.target.error);
            alert('Error al cargar el proyecto');
        };
    } catch (error) {
        console.error('Error en loadProject:', error);
        alert('Error al cargar el proyecto');
    }
}

// Eliminar proyecto
async function deleteProject(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
        return;
    }
    
    try {
        const db = await initDB();
        const transaction = db.transaction(['projects'], 'readwrite');
        const store = transaction.objectStore('projects');
        
        const request = store.delete(id);
        
        request.onsuccess = () => {
            alert('Proyecto eliminado correctamente');
            loadProjectsList(); // Actualizar lista
        };
        
        request.onerror = event => {
            console.error('Error al eliminar el proyecto:', event.target.error);
            alert('Error al eliminar el proyecto');
        };
    } catch (error) {
        console.error('Error en deleteProject:', error);
        alert('Error al eliminar el proyecto');
    }
}