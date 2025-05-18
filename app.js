
let originalData = null;
let processedData = null;
let charts = {};
let currentPage = 1;
let rowsPerPage = 20;
let filteredData = null;

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const manageProjectsBtn = document.getElementById('manageProjectsBtn');
    const projectsManager = document.getElementById('projectsManager');
    const saveProjectBtn = document.getElementById('saveProjectBtn');
    const searchBtn = document.getElementById('searchBtn');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');

    // Configurar paginación
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTableData();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil((filteredData || processedData).length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTableData();
        }
    });

    // Configurar búsqueda
    searchBtn.addEventListener('click', filterData);

    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Evita enviar formularios si los hay
            filterData(); // Llama a la función de filtrar
        }
    });


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
    const sendEmailBtn = document.getElementById('sendEmailBtn');
    sendEmailBtn.addEventListener('click', () => {
        const message = document.getElementById('analysisContent').innerText;
        document.getElementById('emailMessage').value = message;

        emailjs.sendForm('service_lbht95k', 'template_b6bvw1d', '#emailForm')
            .then(() => {
                alert('Informe enviado exitosamente a agrupacionia2025@gmail.com');
            }, (error) => {
                console.error('Error al enviar:', error);
                alert('Error al enviar el informe por correo.');
            });
    });


    // Configurar modal
    const modal = document.getElementById('detailModal');
    const closeButton = modal.querySelector('.close-button');
    
    closeButton.onclick = function() {
        modal.style.display = 'none';
    };
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
});

// Inicializar componentes de la IA cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    const generateAIAnalysisBtn = document.getElementById('generateAIAnalysisBtn');
    
    if (generateAIAnalysisBtn) {
        generateAIAnalysisBtn.addEventListener('click', generateLocalAIAnalysis);
    }
});

// Función para análisis de outliers faltante

// Análisis de outliers y anomalías
async function performOutlierAnalysis(data, numericColumns) {
    const outlierResults = {
        univariateOutliers: {},
        multivariateOutliers: [],
        anomalies: []
    };
    
    // 3.1 Detección de outliers univariados (por columna individual)
    for (const column of numericColumns) {
        try {
            const values = data.map(row => parseFloat(row[column]));
            
            // Calcular cuartiles para método IQR
            const sortedValues = [...values].sort((a, b) => a - b);
            const n = sortedValues.length;
            
            const q1Index = Math.floor(n * 0.25);
            const q3Index = Math.floor(n * 0.75);
            
            const q1 = sortedValues[q1Index];
            const q3 = sortedValues[q3Index];
            const iqr = q3 - q1;
            
            const lowerBound = q1 - 1.5 * iqr;
            const upperBound = q3 + 1.5 * iqr;
            
            const outliers = data.filter((row, index) => {
                const value = parseFloat(row[column]);
                return value < lowerBound || value > upperBound;
            });
            
            if (outliers.length > 0) {
                outlierResults.univariateOutliers[column] = {
                    count: outliers.length,
                    percentage: (outliers.length / data.length * 100).toFixed(1),
                    indices: outliers.map(row => row.Código),
                    bounds: { lower: lowerBound, upper: upperBound }
                };
            }
        } catch (e) {
            console.warn(`Error al detectar outliers en ${column}:`, e);
        }
    }
    
    // Para simplificar, vamos a implementar una versión básica de la detección multivariada
    try {
        // Detección de outliers multivariados
        if (numericColumns.length >= 2) {
            const col1 = numericColumns[0];
            const col2 = numericColumns.length > 1 ? numericColumns[1] : numericColumns[0];
            
            // Calcular medias
            const values1 = data.map(row => parseFloat(row[col1]));
            const values2 = data.map(row => parseFloat(row[col2]));
            
            const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
            const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;
            
            // Calcular distancias euclidianas al centro
            const distances = [];
            for (let i = 0; i < data.length; i++) {
                const dist = Math.sqrt(
                    Math.pow(values1[i] - mean1, 2) + 
                    Math.pow(values2[i] - mean2, 2)
                );
                
                distances.push({
                    index: i,
                    distance: dist,
                    code: data[i].Código
                });
            }
            
            // Ordenar por distancia
            distances.sort((a, b) => b.distance - a.distance);
            
            // Los 5% más alejados se consideran outliers
            const outlierCount = Math.ceil(data.length * 0.05);
            outlierResults.multivariateOutliers = distances.slice(0, outlierCount);
        }
    } catch (e) {
        console.warn("Error en detección de outliers multivariados:", e);
    }
    
    // Detección de anomalías en patrones
    try {
        if (numericColumns.length > 0) {
            const column = numericColumns[0];
            const values = data.map(row => parseFloat(row[column]));
            
            // Calcular diferencias entre valores consecutivos
            const diffs = [];
            for (let i = 1; i < values.length; i++) {
                diffs.push({
                    index: i,
                    diff: values[i] - values[i-1],
                    code: data[i].Código
                });
            }
            
            // Calcular la media y desviación estándar de las diferencias
            const diffValues = diffs.map(d => d.diff);
            const meanDiff = diffValues.reduce((a, b) => a + b, 0) / diffValues.length;
            
            let sumSqDiff = 0;
            for (const diff of diffValues) {
                sumSqDiff += Math.pow(diff - meanDiff, 2);
            }
            const stdDevDiff = Math.sqrt(sumSqDiff / diffValues.length);
            
            // Anomalías son diferencias que se alejan más de 2 desviaciones estándar
            outlierResults.anomalies = diffs.filter(d => 
                Math.abs(d.diff - meanDiff) > 2 * stdDevDiff
            );
        }
    } catch (e) {
        console.warn("Error en detección de anomalías:", e);
    }
    
    return outlierResults;
}

// Función principal para generar análisis con IA local
// Versión simplificada del análisis IA para GitHub Pages
// Esta versión no depende de TensorFlow.js

// Reemplaza la función original por esta versión más simple
async function generateLocalAIAnalysis() {
    if (!processedData || processedData.length === 0) {
        alert('No hay datos para analizar');
        return;
    }
    
    const aiAnalysisContent = document.getElementById('aiAnalysisContent');
    const aiAnalysisLoading = document.getElementById('aiAnalysisLoading');
    
    // Mostrar indicador de carga
    aiAnalysisLoading.classList.remove('hidden');
    aiAnalysisContent.innerHTML = '';
    
    try {
        // Preparar los datos
        const headers = Object.keys(processedData[0]).filter(h => h !== 'Código');
        
        // Identificar columnas numéricas y categóricas con método más simple
        const numericColumns = [];
        const categoricalColumns = [];
        
        headers.forEach(header => {
            // Comprobar si al menos el 90% de valores son numéricos
            let numericCount = 0;
            
            processedData.forEach(row => {
                if (!isNaN(parseFloat(row[header])) && isFinite(row[header])) {
                    numericCount++;
                }
            });
            
            if (numericCount >= processedData.length * 0.9) {
                numericColumns.push(header);
            } else {
                categoricalColumns.push(header);
            }
        });
        
        // ANÁLISIS SIMPLIFICADO
        
        // 1. Calcular estadísticas básicas
        const columnStats = {};
        numericColumns.forEach(column => {
            const values = processedData.map(row => parseFloat(row[column]));
            
            // Estadísticas básicas
            const min = Math.min(...values);
            const max = Math.max(...values);
            const sum = values.reduce((a, b) => a + b, 0);
            const mean = sum / values.length;
            
            // Calcular desviación estándar
            const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
            const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
            const stdDev = Math.sqrt(variance);
            
            // Ordenar valores para calcular percentiles
            const sortedValues = [...values].sort((a, b) => a - b);
            const median = sortedValues[Math.floor(sortedValues.length / 2)];
            
            columnStats[column] = {
                min,
                max,
                mean,
                median,
                stdDev,
                range: max - min
            };
        });
        
        // 2. Calcular frecuencias de categorías
        const categoryStats = {};
        categoricalColumns.forEach(column => {
            const frequencies = {};
            processedData.forEach(row => {
                const value = row[column];
                frequencies[value] = (frequencies[value] || 0) + 1;
            });
            
            // Encontrar categoría más común
            let maxCount = 0;
            let mostFrequent = '';
            Object.entries(frequencies).forEach(([category, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    mostFrequent = category;
                }
            });
            
            categoryStats[column] = {
                uniqueValues: Object.keys(frequencies).length,
                mostFrequent,
                mostFrequentCount: maxCount,
                dominancePercentage: (maxCount / processedData.length * 100).toFixed(1)
            };
        });
        
        // 3. Calcular correlaciones simples
        const correlations = [];
        if (numericColumns.length >= 2) {
            for (let i = 0; i < numericColumns.length; i++) {
                for (let j = i + 1; j < numericColumns.length; j++) {
                    const col1 = numericColumns[i];
                    const col2 = numericColumns[j];
                    
                    const values1 = processedData.map(row => parseFloat(row[col1]));
                    const values2 = processedData.map(row => parseFloat(row[col2]));
                    
                    const correlation = simpleCorrelation(values1, values2);
                    
                    if (Math.abs(correlation) > 0.3) {
                        correlations.push({
                            columns: [col1, col2],
                            value: correlation,
                            strength: getCorrelationStrength(correlation),
                            direction: correlation > 0 ? 'positiva' : 'negativa'
                        });
                    }
                }
            }
            
            // Ordenar correlaciones por intensidad
            correlations.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
        }
        
        // 4. Detectar outliers simples
        const outliers = {};
        numericColumns.forEach(column => {
            const values = processedData.map(row => parseFloat(row[column]));
            const mean = columnStats[column].mean;
            const stdDev = columnStats[column].stdDev;
            
            // Considerar outliers a valores a más de 2 desviaciones estándar
            const outlierValues = values.filter(value => 
                Math.abs(value - mean) > 2 * stdDev
            );
            
            if (outlierValues.length > 0) {
                outliers[column] = {
                    count: outlierValues.length,
                    percentage: (outlierValues.length / values.length * 100).toFixed(1)
                };
            }
        });
        
        // 5. Identificar tendencias simples
        const trends = [];
        numericColumns.forEach(column => {
            const values = processedData.map(row => parseFloat(row[column]));
            
            // Dividir en 3 segmentos
            const segmentSize = Math.floor(values.length / 3);
            if (segmentSize > 0) {
                const firstSegment = values.slice(0, segmentSize);
                const lastSegment = values.slice(-segmentSize);
                
                const firstMean = firstSegment.reduce((a, b) => a + b, 0) / firstSegment.length;
                const lastMean = lastSegment.reduce((a, b) => a + b, 0) / lastSegment.length;
                
                // Calcular cambio porcentual
                const percentChange = ((lastMean - firstMean) / firstMean * 100).toFixed(1);
                
                if (Math.abs(parseFloat(percentChange)) > 5) {
                    let direction = '';
                    let interpretation = '';
                    
                    if (parseFloat(percentChange) > 10) {
                        direction = 'creciente';
                        interpretation = 'Se observa un claro aumento progresivo.';
                    } else if (parseFloat(percentChange) < -10) {
                        direction = 'decreciente';
                        interpretation = 'Se observa una clara disminución progresiva.';
                    } else if (parseFloat(percentChange) > 5) {
                        direction = 'ligeramente creciente';
                        interpretation = 'Existe una ligera tendencia al alza.';
                    } else if (parseFloat(percentChange) < -5) {
                        direction = 'ligeramente decreciente';
                        interpretation = 'Existe una ligera tendencia a la baja.';
                    } else {
                        direction = 'estable';
                        interpretation = 'La variable muestra un comportamiento relativamente estable.';
                    }
                    
                    trends.push({
                        variable: column,
                        direction,
                        interpretation,
                        changePercentage: percentChange
                    });
                }
            }
        });
        
        // Ordenar tendencias por magnitud de cambio
        trends.sort((a, b) => 
            Math.abs(parseFloat(b.changePercentage)) - Math.abs(parseFloat(a.changePercentage))
        );
        
        // 6. Identificar relaciones entre categóricas y numéricas
        const categoricalInsights = [];
        if (categoricalColumns.length > 0 && numericColumns.length > 0) {
            categoricalColumns.slice(0, 2).forEach(catColumn => {
                numericColumns.slice(0, 2).forEach(numColumn => {
                    // Agrupar por categoría
                    const categoryGroups = {};
                    processedData.forEach(row => {
                        const category = row[catColumn];
                        const value = parseFloat(row[numColumn]);
                        
                        if (!categoryGroups[category]) {
                            categoryGroups[category] = [];
                        }
                        
                        categoryGroups[category].push(value);
                    });
                    
                    // Calcular media por categoría
                    const categoryMeans = {};
                    Object.entries(categoryGroups).forEach(([category, values]) => {
                        if (values.length >= 3) { // Solo considerar categorías con suficientes registros
                            categoryMeans[category] = values.reduce((a, b) => a + b, 0) / values.length;
                        }
                    });
                    
                    // Calcular media global
                    const allValues = processedData.map(row => parseFloat(row[numColumn]));
                    const globalMean = allValues.reduce((a, b) => a + b, 0) / allValues.length;
                    
                    // Identificar categorías con diferencias significativas
                    const significantCategories = [];
                    Object.entries(categoryMeans).forEach(([category, mean]) => {
                        const percentDiff = ((mean - globalMean) / globalMean * 100).toFixed(1);
                        
                        if (Math.abs(parseFloat(percentDiff)) > 15) {
                            significantCategories.push({
                                category,
                                mean,
                                percentDiff,
                                isHigher: mean > globalMean
                            });
                        }
                    });
                    
                    // Ordenar por magnitud de diferencia
                    significantCategories.sort((a, b) => 
                        Math.abs(parseFloat(b.percentDiff)) - Math.abs(parseFloat(a.percentDiff))
                    );
                    
                    if (significantCategories.length > 0) {
                        categoricalInsights.push({
                            categoricalColumn: catColumn,
                            numericColumn: numColumn,
                            significantCategories: significantCategories.slice(0, 3)
                        });
                    }
                });
            });
        }
        
        // GENERAR RECOMENDACIONES
        const recommendations = [];
        
        // 1. Recomendaciones basadas en correlaciones
        if (correlations.length > 0) {
            const topCorrelation = correlations[0];
            recommendations.push({
                type: 'correlación',
                title: `Aprovechar la relación entre variables`,
                description: `Existe una correlación ${topCorrelation.strength} ${topCorrelation.direction} (${topCorrelation.value.toFixed(2)}) entre ${topCorrelation.columns[0]} y ${topCorrelation.columns[1]}.`,
                action: `Considerar la interacción entre estas variables en estrategias futuras.`
            });
        }
        
        // 2. Recomendaciones basadas en outliers
        const outlierColumns = Object.keys(outliers);
        if (outlierColumns.length > 0) {
            const topOutlierColumn = outlierColumns[0];
            const outlierInfo = outliers[topOutlierColumn];
            
            recommendations.push({
                type: 'outliers',
                title: `Investigar valores atípicos`,
                description: `Se identificaron ${outlierInfo.count} valores atípicos (${outlierInfo.percentage}%) en ${topOutlierColumn}.`,
                action: `Revisar estos casos excepcionales para identificar oportunidades o anomalías.`
            });
        }
        
        // 3. Recomendaciones basadas en tendencias
        if (trends.length > 0) {
            const topTrend = trends[0];
            recommendations.push({
                type: 'tendencia',
                title: `Seguimiento de tendencia ${topTrend.direction}`,
                description: `${topTrend.variable} muestra una tendencia ${topTrend.direction} (${topTrend.changePercentage}%).`,
                action: `Monitorizar esta evolución y ajustar estrategias en consecuencia.`
            });
        }
        
        // 4. Recomendaciones basadas en insights categóricos
        if (categoricalInsights.length > 0) {
            const topInsight = categoricalInsights[0];
            const topCategory = topInsight.significantCategories[0];
            
            recommendations.push({
                type: 'segmento',
                title: `Enfoque en segmento destacado`,
                description: `La categoría "${topCategory.category}" en ${topInsight.categoricalColumn} muestra valores de ${topInsight.numericColumn} un ${Math.abs(parseFloat(topCategory.percentDiff))}% ${topCategory.isHigher ? 'superiores' : 'inferiores'} a la media.`,
                action: `Analizar las características específicas de este segmento para estrategias personalizadas.`
            });
        }
        
        // RENDERIZAR RESULTADOS
        renderSimplifiedAnalysis(
            columnStats,
            categoryStats,
            correlations,
            outliers,
            trends,
            categoricalInsights,
            recommendations
        );
        
    } catch (error) {
        console.error('Error en el análisis IA:', error);
        aiAnalysisContent.innerHTML = `
            <div class="error-message">
                <h3>Error al generar el análisis</h3>
                <p>${error.message || 'Ocurrió un error al analizar los datos'}</p>
                <p>Intenta con un conjunto de datos diferente o contacta con soporte.</p>
            </div>
        `;
    } finally {
        // Ocultar indicador de carga
        aiAnalysisLoading.classList.add('hidden');
    }
}

// Función de correlación simplificada
function simpleCorrelation(array1, array2) {
    if (array1.length !== array2.length) {
        return 0;
    }
    
    const n = array1.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    
    for (let i = 0; i < n; i++) {
        sumX += array1[i];
        sumY += array2[i];
        sumXY += array1[i] * array2[i];
        sumX2 += array1[i] * array1[i];
        sumY2 += array2[i] * array2[i];
    }
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    if (denominator === 0) return 0;
    
    return numerator / denominator;
}

// Función para renderizar el análisis simplificado
function renderSimplifiedAnalysis(
    columnStats,
    categoryStats,
    correlations,
    outliers,
    trends,
    categoricalInsights,
    recommendations
) {
    const aiAnalysisContent = document.getElementById('aiAnalysisContent');
    
    // Construir HTML
    let html = `
        <div class="ai-analysis-results">
            <h3>Resumen de Hallazgos Principales</h3>
            <div class="insights-container">
    `;
    
    // 1. Mostrar correlaciones importantes
    if (correlations.length > 0) {
        const topCorrelation = correlations[0];
        html += `
            <div class="insight-card">
                <div class="insight-header">
                    <span class="insight-icon">📊</span>
                    <h4>Correlación ${topCorrelation.strength}</h4>
                </div>
                <p>Se ha identificado una <strong>correlación ${topCorrelation.strength} ${topCorrelation.direction}</strong> 
                (${topCorrelation.value.toFixed(2)}) entre <span class="metric-highlight">${topCorrelation.columns[0]}</span> 
                y <span class="metric-highlight">${topCorrelation.columns[1]}</span>.</p>
                <p>Esto significa que cuando ${topCorrelation.columns[0]} ${topCorrelation.value > 0 ? 'aumenta' : 'disminuye'}, 
                ${topCorrelation.columns[1]} tiende a ${topCorrelation.value > 0 ? 'aumentar' : 'disminuyer'} también.</p>
                <div class="ai-tags">
                    <span class="ai-tag">Correlación</span>
                    <span class="ai-tag">${topCorrelation.strength}</span>
                    <span class="ai-tag">${topCorrelation.value > 0 ? 'Positiva' : 'Negativa'}</span>
                </div>
            </div>
        `;
    }
    
    // 2. Mostrar una distribución interesante
    const numericColumns = Object.keys(columnStats);
    if (numericColumns.length > 0) {
        const column = numericColumns[0];
        const stats = columnStats[column];
        
        html += `
            <div class="insight-card">
                <div class="insight-header">
                    <span class="insight-icon">📈</span>
                    <h4>Distribución de ${column}</h4>
                </div>
                <p>La variable <span class="metric-highlight">${column}</span> tiene un rango de <strong>${stats.min.toFixed(2)}</strong> a <strong>${stats.max.toFixed(2)}</strong>, 
                con una media de <strong>${stats.mean.toFixed(2)}</strong> y una mediana de <strong>${stats.median.toFixed(2)}</strong>.</p>
                <p>La desviación estándar es <strong>${stats.stdDev.toFixed(2)}</strong>, lo que indica el grado de dispersión de los datos respecto a la media.</p>
                <div class="ai-tags">
                    <span class="ai-tag">Estadísticas</span>
                    <span class="ai-tag">Distribución</span>
                </div>
            </div>
        `;
    }
    
    // 3. Mostrar outliers significativos
    const outlierColumns = Object.keys(outliers);
    if (outlierColumns.length > 0) {
        const columnWithMostOutliers = outlierColumns[0];
        const outlierInfo = outliers[columnWithMostOutliers];
        
        html += `
            <div class="insight-card">
                <div class="insight-header">
                    <span class="insight-icon">⚠️</span>
                    <h4>Valores Atípicos Detectados</h4>
                </div>
                <p>Se identificaron <span class="metric-highlight">${outlierInfo.count} valores atípicos</span> 
                (${outlierInfo.percentage}%) en <strong>${columnWithMostOutliers}</strong>.</p>
                <p>Estos valores se alejan significativamente del comportamiento general y podrían representar casos especiales
                o anomalías que merecen atención.</p>
                <div class="ai-tags">
                    <span class="ai-tag">Outliers</span>
                    <span class="ai-tag">${columnWithMostOutliers}</span>
                </div>
            </div>
        `;
    }
    
    // 4. Mostrar una tendencia importante
    if (trends.length > 0) {
        const topTrend = trends[0];
        
        html += `
            <div class="insight-card">
                <div class="insight-header">
                    <span class="insight-icon">📉</span>
                    <h4>Tendencia Identificada</h4>
                </div>
                <p>Se ha detectado una <strong>tendencia ${topTrend.direction}</strong> en 
                <span class="metric-highlight">${topTrend.variable}</span> 
                con un cambio de ${topTrend.changePercentage}%.</p>
                <p>${topTrend.interpretation}</p>
                <div class="ai-tags">
                    <span class="ai-tag">Tendencia</span>
                    <span class="ai-tag">${topTrend.direction}</span>
                </div>
            </div>
        `;
    }
    
    // 5. Mostrar insight de categoría si existe
    if (categoricalInsights.length > 0) {
        const insight = categoricalInsights[0];
        const category = insight.significantCategories[0];
        
        html += `
            <div class="insight-card">
                <div class="insight-header">
                    <span class="insight-icon">🔍</span>
                    <h4>Segmento Destacado</h4>
                </div>
                <p>La categoría <span class="metric-highlight">"${category.category}"</span> en <strong>${insight.categoricalColumn}</strong> 
                muestra valores de <strong>${insight.numericColumn}</strong> un <strong>${Math.abs(parseFloat(category.percentDiff))}%</strong> 
                ${category.isHigher ? 'superiores' : 'inferiores'} a la media general.</p>
                <p>Este segmento presenta un comportamiento distintivo que podría representar una oportunidad o un desafío específico.</p>
                <div class="ai-tags">
                    <span class="ai-tag">Segmentación</span>
                    <span class="ai-tag">${category.isHigher ? 'Rendimiento superior' : 'Rendimiento inferior'}</span>
                </div>
            </div>
        `;
    }
    
    // Cerrar sección de insights
    html += `
            </div>
            
            <h3>Recomendaciones Basadas en IA</h3>
            <ul class="recommendations-list">
    `;
    
    // Agregar recomendaciones
    if (recommendations.length > 0) {
        recommendations.forEach(rec => {
            html += `
                <li>
                    <strong>${rec.title}:</strong> ${rec.description} 
                    <em>${rec.action}</em>
                </li>
            `;
        });
    } else {
        html += `<li>No se pudieron generar recomendaciones específicas con los datos disponibles.</li>`;
    }
    
    html += `
            </ul>
            
            <h3>Metodología del Análisis</h3>
            <p>Este análisis ha sido generado utilizando algoritmos de análisis estadístico avanzado que funcionan 
            localmente en su navegador. Se han aplicado técnicas de análisis de correlaciones, detección de outliers,
            análisis de tendencias y segmentación de datos para identificar patrones y relaciones significativas.</p>
            
            <p>Técnicas utilizadas:</p>
            <ul>
                <li>Análisis estadístico descriptivo (media, mediana, desviación estándar)</li>
                <li>Detección de correlaciones entre variables numéricas</li>
                <li>Identificación de valores atípicos (outliers)</li>
                <li>Análisis de tendencias en variables numéricas</li>
                <li>Segmentación por categorías y análisis de rendimiento por segmentos</li>
            </ul>
        </div>
    `;
    
    // Mostrar el análisis en la interfaz
    aiAnalysisContent.innerHTML = html;
}
// 1. Análisis estadístico avanzado
async function performStatisticalAnalysis(data, numericColumns, categoricalColumns) {
    // Resultado del análisis estadístico
    const statsResults = {
        correlations: [],
        distributions: {},
        timeSeries: null,
        categoricalInsights: []
    };
    
    // 1.1 Análisis de correlaciones entre variables numéricas
    if (numericColumns.length >= 2) {
        for (let i = 0; i < numericColumns.length; i++) {
            for (let j = i + 1; j < numericColumns.length; j++) {
                try {
                    const col1 = numericColumns[i];
                    const col2 = numericColumns[j];
                    
                    const values1 = data.map(row => parseFloat(row[col1]));
                    const values2 = data.map(row => parseFloat(row[col2]));
                    
                    // Calcular correlación
                    const correlation = calculateCorrelation(values1, values2);
                    
                    // Solo guardar correlaciones significativas
                    if (Math.abs(correlation) > 0.3) {
                        statsResults.correlations.push({
                            columns: [col1, col2],
                            value: correlation,
                            strength: getCorrelationStrength(correlation),
                            direction: correlation > 0 ? 'positiva' : 'negativa'
                        });
                    }
                } catch (e) {
                    console.warn(`Error al calcular correlación entre ${numericColumns[i]} y ${numericColumns[j]}:`, e);
                }
            }
        }
        
        // Ordenar correlaciones de más fuertes a más débiles
        statsResults.correlations.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    }
    
    // 1.2 Análisis de distribuciones para columnas numéricas
    for (const column of numericColumns) {
        try {
            const values = data.map(row => parseFloat(row[column]));
            
            // Estadísticas básicas
            const stats = calculateNumericStats(values);
            
            // Determinar tipo de distribución
            const distributionType = determineDistributionType(values, stats);
            
            statsResults.distributions[column] = {
                ...stats,
                distributionType,
                skewness: calculateSkewness(values, stats.mean, stats.standardDeviation),
                kurtosis: calculateKurtosis(values, stats.mean, stats.standardDeviation)
            };
        } catch (e) {
            console.warn(`Error al analizar distribución de ${column}:`, e);
        }
    }
    
    // 1.3 Análisis de tendencias temporales si hay columnas de tiempo
    const timeColumns = categoricalColumns.filter(col => 
        col.toLowerCase().includes('fecha') || 
        col.toLowerCase().includes('año') || 
        col.toLowerCase().includes('mes') || 
        col.toLowerCase().includes('time') || 
        col.toLowerCase().includes('year') || 
        col.toLowerCase().includes('date')
    );
    
    if (timeColumns.length > 0 && numericColumns.length > 0) {
        try {
            statsResults.timeSeries = analyzeTimeSeries(data, timeColumns[0], numericColumns[0]);
        } catch (e) {
            console.warn('Error en análisis de series temporales:', e);
        }
    }
    
    // 1.4 Análisis de columnas categóricas
    for (const column of categoricalColumns) {
        try {
            const categoricalInsight = analyzeCategoricalColumn(data, column, numericColumns);
            if (categoricalInsight) {
                statsResults.categoricalInsights.push(categoricalInsight);
            }
        } catch (e) {
            console.warn(`Error al analizar columna categórica ${column}:`, e);
        }
    }
    
    return statsResults;
}

// Función para calcular estadísticas numéricas
function calculateNumericStats(values) {
    // Ordenar valores para cálculos basados en orden
    const sortedValues = [...values].sort((a, b) => a - b);
    const n = values.length;
    
    // Estadísticas básicas
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;
    
    // Desviación estándar
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / n;
    const standardDeviation = Math.sqrt(variance);
    
    // Cuartiles
    const q1Index = Math.floor(n * 0.25);
    const q2Index = Math.floor(n * 0.5);
    const q3Index = Math.floor(n * 0.75);
    
    return {
        min,
        max,
        mean,
        median: sortedValues[q2Index],
        standardDeviation,
        variance,
        quartiles: {
            q1: sortedValues[q1Index],
            q2: sortedValues[q2Index],
            q3: sortedValues[q3Index]
        },
        range: max - min
    };
}

// Calcular asimetría (skewness)
function calculateSkewness(values, mean, stdDev) {
    if (stdDev === 0) return 0;
    
    const n = values.length;
    let sumCubedDeviations = 0;
    
    for (let i = 0; i < n; i++) {
        sumCubedDeviations += Math.pow((values[i] - mean) / stdDev, 3);
    }
    
    return sumCubedDeviations / n;
}

// Calcular curtosis
function calculateKurtosis(values, mean, stdDev) {
    if (stdDev === 0) return 3; // Valor para distribución normal
    
    const n = values.length;
    let sumQuarticDeviations = 0;
    
    for (let i = 0; i < n; i++) {
        sumQuarticDeviations += Math.pow((values[i] - mean) / stdDev, 4);
    }
    
    return sumQuarticDeviations / n;
}

// Determinar tipo de distribución
function determineDistributionType(values, stats) {
    // Calcular skewness
    const skewness = calculateSkewness(values, stats.mean, stats.standardDeviation);
    
    // Calcular kurtosis
    const kurtosis = calculateKurtosis(values, stats.mean, stats.standardDeviation);
    
    // Determinar tipo basado en skewness y kurtosis
    if (Math.abs(skewness) < 0.5 && Math.abs(kurtosis - 3) < 0.5) {
        return 'Normal';
    } else if (skewness > 1) {
        return 'Asimétrica positiva';
    } else if (skewness < -1) {
        return 'Asimétrica negativa';
    } else if (kurtosis > 4) {
        return 'Leptocúrtica (colas pesadas)';
    } else if (kurtosis < 2) {
        return 'Platicúrtica (colas ligeras)';
    } else {
        return 'No definido claramente';
    }
}

// Analizar series temporales
function analyzeTimeSeries(data, timeColumn, valueColumn) {
    try {
        // Intentar ordenar por la columna temporal
        const orderedData = [...data].sort((a, b) => {
            // Ordenar numéricamente si los valores son numéricos (años, etc.)
            if (!isNaN(parseFloat(a[timeColumn])) && !isNaN(parseFloat(b[timeColumn]))) {
                return parseFloat(a[timeColumn]) - parseFloat(b[timeColumn]);
            }
            // Ordenar alfabéticamente si son textos (meses, etc.)
            return String(a[timeColumn]).localeCompare(String(b[timeColumn]));
        });
        
        // Dividir en segmentos (inicio, medio, final)
        const segmentSize = Math.ceil(orderedData.length / 3);
        const firstSegment = orderedData.slice(0, segmentSize);
        const middleSegment = orderedData.slice(segmentSize, 2 * segmentSize);
        const lastSegment = orderedData.slice(2 * segmentSize);
        
        // Calcular medias para cada segmento
        const firstMean = firstSegment.reduce((sum, row) => sum + parseFloat(row[valueColumn]), 0) / firstSegment.length;
        const middleMean = middleSegment.reduce((sum, row) => sum + parseFloat(row[valueColumn]), 0) / middleSegment.length;
        const lastMean = lastSegment.reduce((sum, row) => sum + parseFloat(row[valueColumn]), 0) / lastSegment.length;
        
        // Calcular cambios porcentuales
        const firstToMiddleChange = ((middleMean - firstMean) / firstMean) * 100;
        const middleToLastChange = ((lastMean - middleMean) / middleMean) * 100;
        const overallChange = ((lastMean - firstMean) / firstMean) * 100;
        
        // Determinar tendencia
        let trendType = 'Estable';
        if (overallChange > 10) {
            trendType = 'Creciente';
        } else if (overallChange < -10) {
            trendType = 'Decreciente';
        } else if (Math.abs(firstToMiddleChange) > 15 && Math.abs(middleToLastChange) > 15) {
            trendType = 'Fluctuante';
        }
        
        // Detección de estacionalidad (muy simplificada)
        const hasSeasonality = false; // Implementación simplificada
        
        return {
            timeColumn,
            valueColumn,
            segmentMeans: [firstMean, middleMean, lastMean],
            overallChange,
            trendType,
            hasSeasonality
        };
    } catch (e) {
        console.warn('Error en análisis de series temporales:', e);
        return null;
    }
}

// Analizar columna categórica
function analyzeCategoricalColumn(data, column, numericColumns) {
    // Contar frecuencias
    const frequencies = {};
    data.forEach(row => {
        const value = row[column];
        frequencies[value] = (frequencies[value] || 0) + 1;
    });
    
    // Obtener categorías ordenadas por frecuencia
    const sortedCategories = Object.entries(frequencies)
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => ({
            category,
            count,
            percentage: (count / data.length * 100).toFixed(1)
        }));
    
    // Si hay columnas numéricas, analizar relación entre categorías y valores numéricos
    let categoryPerformance = null;
    if (numericColumns.length > 0) {
        const numCol = numericColumns[0]; // Usar primera columna numérica
        
        // Calcular media por categoría
        const categoryStats = {};
        Object.keys(frequencies).forEach(category => {
            const categoryRows = data.filter(row => row[column] === category);
            const values = categoryRows.map(row => parseFloat(row[numCol]));
            
            const sum = values.reduce((acc, val) => acc + val, 0);
            const mean = sum / values.length;
            
            categoryStats[category] = {
                mean,
                count: values.length
            };
        });
        
        // Calcular media global para comparación
        const allValues = data.map(row => parseFloat(row[numCol]));
        const globalMean = allValues.reduce((acc, val) => acc + val, 0) / allValues.length;
        
        // Encontrar categorías con rendimiento destacado
        categoryPerformance = [];
        Object.entries(categoryStats).forEach(([category, stats]) => {
            if (stats.count >= 5) { // Solo considerar categorías con suficientes registros
                const percentDiff = ((stats.mean - globalMean) / globalMean * 100).toFixed(1);
                
                categoryPerformance.push({
                    category,
                    mean: stats.mean,
                    percentDifference: percentDiff,
                    count: stats.count,
                    isOutperforming: stats.mean > globalMean
                });
            }
        });
        
        // Ordenar por diferencia porcentual (absoluta)
        categoryPerformance.sort((a, b) => 
            Math.abs(parseFloat(b.percentDifference)) - Math.abs(parseFloat(a.percentDifference))
        );
    }
    
    return {
        column,
        uniqueValues: Object.keys(frequencies).length,
        topCategories: sortedCategories.slice(0, 5),
        categoryPerformance: categoryPerformance ? categoryPerformance.slice(0, 3) : null
    };
}


// 2. Análisis de patrones y agrupaciones
async function performPatternAnalysis(data, numericColumns, categoricalColumns) {
    const patternResults = {
        clusters: null,
        segments: [],
        trends: [],
        importantFeatures: []
    };
    
    // 2.1 Análisis de clústeres (agrupación) si hay suficientes columnas numéricas
    if (numericColumns.length >= 2 && data.length >= 10) {
        try {
            patternResults.clusters = performBasicClustering(data, numericColumns);
        } catch (e) {
            console.warn('Error en análisis de clústeres:', e);
        }
    }
    
    // 2.2 Identificación de segmentos significativos
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
        try {
            patternResults.segments = identifySignificantSegments(data, categoricalColumns, numericColumns);
        } catch (e) {
            console.warn('Error en identificación de segmentos:', e);
        }
    }
    
    // 2.3 Análisis de tendencias
    try {
        patternResults.trends = identifyDataTrends(data, numericColumns);
    } catch (e) {
        console.warn('Error en análisis de tendencias:', e);
    }
    
    // 2.4 Identificación de características importantes
    if (numericColumns.length >= 1) {
        try {
            patternResults.importantFeatures = identifyImportantFeatures(data, numericColumns, categoricalColumns);
        } catch (e) {
            console.warn('Error en análisis de características importantes:', e);
        }
    }
    
    return patternResults;
}

// 3. Implementar clústeres básicos (versión simplificada de K-means)
function performBasicClustering(data, numericColumns) {
    // Seleccionar dos columnas numéricas principales para simplificar
    const col1 = numericColumns[0];
    const col2 = numericColumns.length > 1 ? numericColumns[1] : numericColumns[0];
    
    // Extraer valores
    const points = data.map(row => [
        parseFloat(row[col1]), 
        parseFloat(row[col2])
    ]);
    
    // Implementación simple de K-means con k=3
    const k = 3;
    let centroids = [];
    
    // Inicializar centroides con puntos aleatorios
    for (let i = 0; i < k; i++) {
        const randomIndex = Math.floor(Math.random() * points.length);
        centroids.push([...points[randomIndex]]);
    }
    
    // Asignar puntos a clústeres
    let clusters = Array(k).fill().map(() => []);
    let changed = true;
    let iterations = 0;
    const maxIterations = 10; // Limitar iteraciones para rendimiento
    
    while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;
        
        // Reiniciar clústeres
        clusters = Array(k).fill().map(() => []);
        
        // Asignar puntos al centroide más cercano
        points.forEach((point, pointIndex) => {
            let minDist = Infinity;
            let clusterIndex = 0;
            
            centroids.forEach((centroid, i) => {
                const dist = euclideanDistance(point, centroid);
                if (dist < minDist) {
                    minDist = dist;
                    clusterIndex = i;
                }
            });
            
            clusters[clusterIndex].push({
                point,
                originalIndex: pointIndex
            });
        });
        
        // Recalcular centroides
        const newCentroids = clusters.map(cluster => {
            if (cluster.length === 0) return [0, 0]; // Evitar división por cero
            
            const sumX = cluster.reduce((sum, item) => sum + item.point[0], 0);
            const sumY = cluster.reduce((sum, item) => sum + item.point[1], 0);
            
            return [sumX / cluster.length, sumY / cluster.length];
        });
        
        // Verificar si los centroides cambiaron
        centroids.forEach((centroid, i) => {
            if (euclideanDistance(centroid, newCentroids[i]) > 0.01) {
                changed = true;
            }
        });
        
        centroids = newCentroids;
    }
    
    // Calcular estadísticas para cada clúster
    const clusterStats = clusters.map((cluster, i) => {
        if (cluster.length === 0) {
            return {
                id: i,
                size: 0,
                centroid: centroids[i],
                isEmpty: true
            };
        }
        
        // Obtener índices originales de los elementos del clúster
        const clusterIndices = cluster.map(item => item.originalIndex);
        
        // Calcular estadísticas de cada columna numérica para este clúster
        const stats = {};
        numericColumns.forEach(col => {
            const values = clusterIndices.map(idx => parseFloat(data[idx][col]));
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            
            stats[col] = mean;
        });
        
        return {
            id: i,
            size: cluster.length,
            percentage: (cluster.length / data.length * 100).toFixed(1),
            centroid: centroids[i],
            stats,
            indices: clusterIndices
        };
    });
    
    return {
        columns: [col1, col2],
        clusters: clusterStats.filter(c => !c.isEmpty),
        iterations
    };
}

// Función auxiliar: distancia euclidiana entre dos puntos
function euclideanDistance(pointA, pointB) {
    return Math.sqrt(
        Math.pow(pointA[0] - pointB[0], 2) + 
        Math.pow(pointA[1] - pointB[1], 2)
    );
}

// 4. Identificar segmentos significativos
function identifySignificantSegments(data, categoricalColumns, numericColumns) {
    const segments = [];
    
    // Solo usar las primeras 2 columnas categóricas para mantenerlo simple
    const catCols = categoricalColumns.slice(0, 2);
    
    // Para cada columna numérica, buscar segmentos categóricos que muestren valores atípicos
    numericColumns.forEach(numCol => {
        catCols.forEach(catCol => {
            try {
                // Agrupar por categoría
                const categoryGroups = {};
                data.forEach(row => {
                    const category = row[catCol];
                    if (!categoryGroups[category]) {
                        categoryGroups[category] = [];
                    }
                    categoryGroups[category].push(parseFloat(row[numCol]));
                });
                
                // Calcular estadísticas por grupo
                const categoryStats = {};
                Object.entries(categoryGroups).forEach(([category, values]) => {
                    if (values.length >= 5) { // Solo considerar grupos con suficientes datos
                        const sum = values.reduce((a, b) => a + b, 0);
                        const mean = sum / values.length;
                        categoryStats[category] = {
                            mean,
                            count: values.length
                        };
                    }
                });
                
                // Calcular media global
                const allValues = data.map(row => parseFloat(row[numCol]));
                const globalMean = allValues.reduce((a, b) => a + b, 0) / allValues.length;
                
                // Identificar categorías con valores significativamente diferentes
                Object.entries(categoryStats).forEach(([category, stats]) => {
                    const percentDiff = ((stats.mean - globalMean) / globalMean * 100);
                    
                    if (Math.abs(percentDiff) > 10) { // Diferencia de al menos 10%
                        segments.push({
                            segmentName: `${category} (en ${catCol})`,
                            column: catCol,
                            category,
                            metric: numCol,
                            mean: stats.mean,
                            globalMean,
                            difference: Math.abs(percentDiff).toFixed(1),
                            direction: stats.mean > globalMean ? 'mayor' : 'menor',
                            count: stats.count,
                            performance: stats.mean > globalMean ? 'superior' : 'inferior'
                        });
                    }
                });
            } catch (e) {
                console.warn(`Error al analizar segmentos para ${catCol} y ${numCol}:`, e);
            }
        });
    });
    
    // Ordenar por magnitud de diferencia
    segments.sort((a, b) => parseFloat(b.difference) - parseFloat(a.difference));
    
    return segments.slice(0, 5); // Devolver los 5 segmentos más significativos
}

// Identificar tendencias en los datos
function identifyDataTrends(data, numericColumns) {
    const trends = [];
    
    numericColumns.forEach(column => {
        try {
            const values = data.map(row => parseFloat(row[column]));
            
            // Dividir los datos en 3 partes para ver tendencias
            const partSize = Math.ceil(values.length / 3);
            const firstPart = values.slice(0, partSize);
            const middlePart = values.slice(partSize, 2 * partSize);
            const lastPart = values.slice(2 * partSize);
            
            // Calcular medias de cada parte
            const firstMean = firstPart.reduce((sum, v) => sum + v, 0) / firstPart.length;
            const middleMean = middlePart.reduce((sum, v) => sum + v, 0) / middlePart.length;
            const lastMean = lastPart.reduce((sum, v) => sum + v, 0) / lastPart.length;
            
            // Calcular cambio porcentual de principio a fin
            const changePercentage = ((lastMean - firstMean) / firstMean * 100).toFixed(1);
            
            // Solo reportar tendencias significativas (>5% de cambio)
            if (Math.abs(parseFloat(changePercentage)) > 5) {
                let direction = 'estable';
                let interpretation = 'La variable muestra un comportamiento relativamente estable a lo largo del conjunto de datos.';
                
                if (parseFloat(changePercentage) > 10) {
                    direction = 'creciente';
                    interpretation = 'Se observa una clara tendencia al alza que sugiere crecimiento progresivo.';
                } else if (parseFloat(changePercentage) < -10) {
                    direction = 'decreciente';
                    interpretation = 'Se observa una clara tendencia a la baja que sugiere disminución progresiva.';
                } else if (parseFloat(changePercentage) > 5) {
                    direction = 'ligeramente creciente';
                    interpretation = 'Existe una ligera tendencia al alza que podría continuar en el futuro.';
                } else if (parseFloat(changePercentage) < -5) {
                    direction = 'ligeramente decreciente';
                    interpretation = 'Existe una ligera tendencia a la baja que debería monitorearse.';
                }
                
                // Verificar si hay patrón de U o de U invertida
                if (firstMean > middleMean && lastMean > middleMean) {
                    direction = 'en forma de U';
                    interpretation = 'La variable muestra un patrón en forma de U, con descenso inicial seguido de recuperación.';
                } else if (firstMean < middleMean && lastMean < middleMean) {
                    direction = 'en forma de U invertida';
                    interpretation = 'La variable muestra un patrón en forma de U invertida, con aumento inicial seguido de descenso.';
                }
                
                trends.push({
                    variable: column,
                    direction,
                    interpretation,
                    firstMean,
                    middleMean,
                    lastMean,
                    changePercentage,
                    isSignificant: Math.abs(parseFloat(changePercentage)) > 10
                });
            }
        } catch (e) {
            console.warn(`Error al analizar tendencias para ${column}:`, e);
        }
    });
    
    // Ordenar por magnitud de cambio
    trends.sort((a, b) => 
        Math.abs(parseFloat(b.changePercentage)) - Math.abs(parseFloat(a.changePercentage))
    );
    
    return trends.slice(0, 3); // Devolver las 3 tendencias más significativas
}

// Identificar características importantes
function identifyImportantFeatures(data, numericColumns, categoricalColumns) {
    const features = [];
    
    // 1. Características con mayor variabilidad
    numericColumns.forEach(column => {
        try {
            const values = data.map(row => parseFloat(row[column]));
            
            // Estadísticas básicas
            const min = Math.min(...values);
            const max = Math.max(...values);
            const range = max - min;
            const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
            
            // Coeficiente de variación (desviación estándar / media)
            const squaredDifferences = values.map(v => Math.pow(v - mean, 2));
            const variance = squaredDifferences.reduce((sum, v) => sum + v, 0) / values.length;
            const stdDev = Math.sqrt(variance);
            const cv = (stdDev / mean) * 100;
            
            features.push({
                feature: column,
                type: 'numérica',
                variabilityScore: cv,
                rangeScore: range / mean,
                importance: 'variabilidad'
            });
        } catch (e) {
            console.warn(`Error al analizar importancia de ${column}:`, e);
        }
    });
    
    // 2. Características categóricas con distribuciones significativas
    categoricalColumns.forEach(column => {
        try {
            // Contar frecuencias
            const freqMap = {};
            data.forEach(row => {
                const value = row[column];
                freqMap[value] = (freqMap[value] || 0) + 1;
            });
            
            // Calcular entropía de Shannon (menor entropía = distribución más desigual = más informativa)
            let entropy = 0;
            const totalCount = data.length;
            
            Object.values(freqMap).forEach(count => {
                const p = count / totalCount;
                entropy -= p * Math.log2(p);
            });
            
            // Normalizar entropía (dividir por log2 del número de categorías únicas)
            const numCategories = Object.keys(freqMap).length;
            const maxEntropy = Math.log2(numCategories);
            const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;
            
            features.push({
                feature: column,
                type: 'categórica',
                entropyScore: normalizedEntropy,
                uniqueValues: numCategories,
                importance: 'separación'
            });
        } catch (e) {
            console.warn(`Error al analizar importancia de ${column}:`, e);
        }
    });
    
    // Ordenar características por importancia (menor entropía = más importante para categóricas, 
    // mayor variabilidad = más importante para numéricas)
    const sortedNumeric = features
        .filter(f => f.type === 'numérica')
        .sort((a, b) => b.variabilityScore - a.variabilityScore);
    
    const sortedCategorical = features
        .filter(f => f.type === 'categórica')
        .sort((a, b) => a.entropyScore - b.entropyScore); // Menor entropía es mejor
    
    // Combinar los resultados, priorizando las mejores características de cada tipo
    const combinedFeatures = [];
    
    for (let i = 0; i < Math.min(sortedNumeric.length, 2); i++) {
        if (sortedNumeric[i]) combinedFeatures.push(sortedNumeric[i]);
    }
    
    for (let i = 0; i < Math.min(sortedCategorical.length, 2); i++) {
        if (sortedCategorical[i]) combinedFeatures.push(sortedCategorical[i]);
    }
    
    return combinedFeatures;
}

// 4. Generación de recomendaciones basadas en datos
function generateDataDrivenRecommendations(statsAnalysis, patternAnalysis, outlierAnalysis, numericColumns, categoricalColumns) {
    const recommendations = [];
    
    // 4.1 Recomendaciones basadas en correlaciones
    if (statsAnalysis.correlations.length > 0) {
        const strongestCorrelation = statsAnalysis.correlations[0];
        
        if (Math.abs(strongestCorrelation.value) > 0.7) {
            recommendations.push({
                type: 'correlación',
                title: `Aprovechar la fuerte correlación ${strongestCorrelation.direction}`,
                description: `Existe una correlación ${strongestCorrelation.strength} ${strongestCorrelation.direction} (${strongestCorrelation.value.toFixed(2)}) entre ${strongestCorrelation.columns[0]} y ${strongestCorrelation.columns[1]}. Esto sugiere que estos factores están estrechamente relacionados y uno podría usarse para predecir el otro.`,
                action: `Considerar estrategias que optimicen ${strongestCorrelation.columns[0]} para influir positivamente en ${strongestCorrelation.columns[1]}.`
            });
        }
    }
    
    // 4.2 Recomendaciones basadas en distribuciones
    for (const column in statsAnalysis.distributions) {
        const distribution = statsAnalysis.distributions[column];
        
        // Recomendación para distribuciones muy sesgadas
        if (Math.abs(distribution.skewness) > 1.5) {
            const direction = distribution.skewness > 0 ? 'derecha' : 'izquierda';
            recommendations.push({
                type: 'distribución',
                title: `Considerar la asimetría en ${column}`,
                description: `La distribución de ${column} está significativamente sesgada hacia la ${direction} (skewness: ${distribution.skewness.toFixed(2)}), lo que indica una concentración de valores ${direction === 'derecha' ? 'bajos con algunos valores extremadamente altos' : 'altos con algunos valores extremadamente bajos'}.`,
                action: `Para análisis más precisos, considerar transformaciones o modelos que manejen adecuadamente distribuciones sesgadas.`
            });
        }
    }
    
    // 4.3 Recomendaciones basadas en outliers
    const outlierColumns = Object.keys(outlierAnalysis.univariateOutliers);
    if (outlierColumns.length > 0) {
        // Encontrar la columna con mayor porcentaje de outliers
        const columnWithMostOutliers = outlierColumns.reduce((a, b) => 
            parseFloat(outlierAnalysis.univariateOutliers[a].percentage) > 
            parseFloat(outlierAnalysis.univariateOutliers[b].percentage) ? a : b
        );
        
        const outlierInfo = outlierAnalysis.univariateOutliers[columnWithMostOutliers];
        
        recommendations.push({
            type: 'outliers',
            title: `Investigar valores atípicos en ${columnWithMostOutliers}`,
            description: `Se identificaron ${outlierInfo.count} valores atípicos (${outlierInfo.percentage}%) en ${columnWithMostOutliers}. Estos pueden representar casos especiales importantes o errores en los datos.`,
            action: `Revisar estos valores específicos para determinar si representan oportunidades, amenazas o simplemente errores de datos.`
        });
    }
    
    // 4.4 Recomendaciones basadas en segmentos
    if (patternAnalysis.segments.length > 0) {
        const bestSegment = patternAnalysis.segments[0];
        
        recommendations.push({
            type: 'segmentación',
            title: `Enfoque en segmento de alto rendimiento`,
            description: `El segmento "${bestSegment.segmentName}" muestra un rendimiento ${bestSegment.performance} en ${bestSegment.metric} (${bestSegment.difference}% ${bestSegment.direction} que el promedio).`,
            action: `Analizar más a fondo las características de este segmento y considerar estrategias específicas dirigidas a este grupo.`
        });
    }
    
    // 4.5 Recomendaciones generales basadas en la calidad de los datos
    if (numericColumns.length > 0) {
        recommendations.push({
            type: 'calidad',
            title: 'Mejorar la recolección de datos',
            description: 'El análisis muestra que la incorporación de datos temporales o contextuales adicionales podría mejorar significativamente la precisión de los hallazgos.',
            action: 'Considerar la recolección de variables adicionales como fechas, ubicación o información contextual en futuros conjuntos de datos.'
        });
    }
    
    return recommendations;
}

// 5. Función para renderizar el análisis IA local
function renderLocalAIAnalysis(statsAnalysis, patternAnalysis, outlierAnalysis, recommendations, numericColumns, categoricalColumns) {
    const aiAnalysisContent = document.getElementById('aiAnalysisContent');
    
    // Construir contenido HTML del análisis
    let html = `
        <div class="ai-analysis-results">
            <h3>Resumen de Hallazgos Principales</h3>
            <div class="insights-container">
    `;
    
    // 1. Mostrar correlaciones importantes
    if (statsAnalysis.correlations.length > 0) {
        const topCorrelation = statsAnalysis.correlations[0];
        html += `
            <div class="insight-card">
                <div class="insight-header">
                    <span class="insight-icon">📊</span>
                    <h4>Correlación ${topCorrelation.strength}</h4>
                </div>
                <p>Se ha identificado una <strong>correlación ${topCorrelation.strength} ${topCorrelation.direction}</strong> 
                (${topCorrelation.value.toFixed(2)}) entre <span class="metric-highlight">${topCorrelation.columns[0]}</span> 
                y <span class="metric-highlight">${topCorrelation.columns[1]}</span>.</p>
                <p>Esto significa que cuando ${topCorrelation.columns[0]} ${topCorrelation.value > 0 ? 'aumenta' : 'disminuye'}, 
                ${topCorrelation.columns[1]} tiende a ${topCorrelation.value > 0 ? 'aumentar' : 'disminuir'} también.</p>
                <div class="ai-tags">
                    <span class="ai-tag">Correlación</span>
                    <span class="ai-tag">${topCorrelation.strength}</span>
                    <span class="ai-tag">${topCorrelation.value > 0 ? 'Positiva' : 'Negativa'}</span>
                </div>
            </div>
        `;
    }
    
    // 2. Mostrar distribuciones interesantes
    let hasShownDistribution = false;
    for (const column in statsAnalysis.distributions) {
        if (hasShownDistribution) break; // Solo mostrar la primera distribución interesante
        
        const dist = statsAnalysis.distributions[column];
        
        // Verificar si esta distribución es interesante (asimétrica o con kurtosis inusual)
        if (Math.abs(dist.skewness) > 1 || Math.abs(dist.kurtosis - 3) > 1) {
            hasShownDistribution = true;
            
            let distributionDescription = '';
            if (Math.abs(dist.skewness) > 1) {
                const skewDirection = dist.skewness > 0 ? 'derecha' : 'izquierda';
                distributionDescription += `asimétrica hacia la ${skewDirection}`;
            }
            
            if (Math.abs(dist.kurtosis - 3) > 1) {
                if (distributionDescription) distributionDescription += ' y ';
                distributionDescription += dist.kurtosis > 3 
                    ? 'con colas pesadas (mayor presencia de valores extremos)' 
                    : 'con colas ligeras (menor presencia de valores extremos)';
            }
            
            html += `
                <div class="insight-card">
                    <div class="insight-header">
                        <span class="insight-icon">📈</span>
                        <h4>Distribución de ${column}</h4>
                    </div>
                    <p>La variable <span class="metric-highlight">${column}</span> muestra una distribución <strong>${distributionDescription}</strong>.</p>
                    <p>Rango: ${dist.min.toFixed(2)} a ${dist.max.toFixed(2)}, con una media de ${dist.mean.toFixed(2)} 
                    y desviación estándar de ${dist.standardDeviation.toFixed(2)}.</p>
                    <div class="ai-tags">
                        <span class="ai-tag">Distribución</span>
                        <span class="ai-tag">${dist.distributionType}</span>
                        ${Math.abs(dist.skewness) > 1 ? `<span class="ai-tag">Asimétrica</span>` : ''}
                    </div>
                </div>
            `;
        }
    }
    
    // 3. Mostrar outliers significativos
    const outlierColumns = Object.keys(outlierAnalysis.univariateOutliers);
    if (outlierColumns.length > 0) {
        // Encontrar la columna con mayor porcentaje de outliers
        const columnWithMostOutliers = outlierColumns.reduce((a, b) => 
            parseFloat(outlierAnalysis.univariateOutliers[a].percentage) > 
            parseFloat(outlierAnalysis.univariateOutliers[b].percentage) ? a : b
        );
        
        const outlierInfo = outlierAnalysis.univariateOutliers[columnWithMostOutliers];
        
        html += `
            <div class="insight-card">
                <div class="insight-header">
                    <span class="insight-icon">⚠️</span>
                    <h4>Valores Atípicos Detectados</h4>
                </div>
                <p>Se identificaron <span class="metric-highlight">${outlierInfo.count} valores atípicos</span> 
                (${outlierInfo.percentage}%) en <strong>${columnWithMostOutliers}</strong>.</p>
                <p>Estos valores caen fuera del rango esperado (${outlierInfo.bounds.lower.toFixed(2)} - ${outlierInfo.bounds.upper.toFixed(2)}) 
                y pueden representar casos especiales o anomalías importantes.</p>
                <div class="ai-tags">
                    <span class="ai-tag">Outliers</span>
                    <span class="ai-tag">${columnWithMostOutliers}</span>
                </div>
            </div>
        `;
    }
    
    // 4. Mostrar segmentos importantes
    if (patternAnalysis.segments.length > 0) {
        const topSegment = patternAnalysis.segments[0];
        
        html += `
            <div class="insight-card">
                <div class="insight-header">
                    <span class="insight-icon">🔍</span>
                    <h4>Segmento Destacado</h4>
                </div>
                <p>El segmento <span class="metric-highlight">"${topSegment.segmentName}"</span> muestra un 
                rendimiento <strong>${topSegment.performance}</strong> en ${topSegment.metric}.</p>
                <p>Este grupo presenta valores ${topSegment.difference}% ${topSegment.direction} 
                que el promedio general, lo que lo convierte en un segmento de especial interés.</p>
                <div class="ai-tags">
                    <span class="ai-tag">Segmentación</span>
                    <span class="ai-tag">${topSegment.performance}</span>
                </div>
            </div>
        `;
    }
    
    // 5. Mostrar tendencias detectadas
    if (patternAnalysis.trends.length > 0) {
        const topTrend = patternAnalysis.trends[0];
        
        html += `
            <div class="insight-card">
                <div class="insight-header">
                    <span class="insight-icon">📉</span>
                    <h4>Tendencia Identificada</h4>
                </div>
                <p>Se ha detectado una <strong>tendencia ${topTrend.direction}</strong> en 
                <span class="metric-highlight">${topTrend.variable}</span> 
                con un cambio de ${topTrend.changePercentage}% ${topTrend.direction === 'creciente' ? 'positivo' : 'negativo'}.</p>
                <p>${topTrend.interpretation}</p>
                <div class="ai-tags">
                    <span class="ai-tag">Tendencia</span>
                    <span class="ai-tag">${topTrend.direction}</span>
                </div>
            </div>
        `;
    }
    
    // Cerrar sección de insights
    html += `
            </div>
            
            <h3>Recomendaciones Basadas en IA</h3>
            <ul class="recommendations-list">
    `;
    
    // Agregar recomendaciones
    if (recommendations.length > 0) {
        recommendations.forEach(rec => {
            html += `
                <li>
                    <strong>${rec.title}:</strong> ${rec.description} 
                    <em>${rec.action}</em>
                </li>
            `;
        });
    } else {
        html += `<li>No se pudieron generar recomendaciones específicas con los datos disponibles.</li>`;
    }
    
    html += `
            </ul>
            
            <h3>Metodología del Análisis</h3>
            <p>Este análisis ha sido generado utilizando algoritmos de inteligencia artificial que funcionan localmente 
            en su navegador. El sistema ha realizado análisis estadísticos avanzados, detección de patrones, 
            segmentación y análisis de anomalías sobre sus datos sin enviarlos a servidores externos.</p>
            
            <p>Técnicas utilizadas:</p>
            <ul>
                <li>Análisis de correlación entre variables numéricas</li>
                <li>Detección de distribuciones y análisis de asimetría</li>
                <li>Detección de valores atípicos (método IQR)</li>
                ${patternAnalysis.clusters ? '<li>Análisis de clústeres (agrupación automática)</li>' : ''}
                <li>Segmentación basada en variables categóricas</li>
                <li>Análisis de tendencias y patrones</li>
            </ul>
        </div>
    `;
    
    // Mostrar el análisis en la interfaz
    aiAnalysisContent.innerHTML = html;
}

// 6. Función para calcular correlación
function calculateCorrelation(array1, array2) {
    try {
        if (!array1 || !array2 || array1.length !== array2.length || array1.length === 0) {
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
            
            if (isNaN(x) || isNaN(y)) continue;
            
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
    } catch (e) {
        console.error("Error en cálculo de correlación", e);
        return 0;
    }
}

// Función para calcular la fuerza de una correlación
function getCorrelationStrength(correlation) {
    const absCorrelation = Math.abs(correlation);
    if (absCorrelation >= 0.8) return 'muy fuerte';
    if (absCorrelation >= 0.6) return 'fuerte';
    if (absCorrelation >= 0.4) return 'moderada';
    if (absCorrelation >= 0.2) return 'débil';
    return 'muy débil';
}



// Final
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
        
        filteredData = null;
        currentPage = 1;
        
        // Actualizar UI
        setTimeout(() => {
            populateFilterOptions();
            renderTableData();
            createFrequencyTables();
            createBarCharts();
            generateAnalysis();
            
            loadingSection.classList.add('hidden');
            resultsSection.classList.remove('hidden');
        }, 1000);
    };
    
    reader.readAsArrayBuffer(file);
}

// Poblar opciones del filtro
function populateFilterOptions() {
    if (!processedData || processedData.length === 0) return;
    
    const filterColumn = document.getElementById('filterColumn');
    filterColumn.innerHTML = '<option value="all">Todas las columnas</option>';
    
    const headers = Object.keys(processedData[0]);
    
    headers.forEach(header => {
        const option = document.createElement('option');
        option.value = header;
        option.textContent = header;
        filterColumn.appendChild(option);
    });
}

// Filtrar datos
function filterData() {
    if (!processedData || processedData.length === 0) return;
    
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const filterColumn = document.getElementById('filterColumn').value;
    
    if (!searchInput.trim()) {
        filteredData = null;
        currentPage = 1;
        renderTableData();
        return;
    }
    
    if (filterColumn === 'all') {
        filteredData = processedData.filter(row => {
            return Object.values(row).some(value => 
                String(value).toLowerCase().includes(searchInput)
            );
        });
    } else {
        filteredData = processedData.filter(row => 
            String(row[filterColumn]).toLowerCase().includes(searchInput)
        );
    }
    
    currentPage = 1;
    renderTableData();
}

// Renderizar tabla con paginación
function renderTableData() {
    if (!processedData || processedData.length === 0) return;
    
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    const pageInfo = document.getElementById('pageInfo');
    
    // Usar datos filtrados o todos los datos
    const dataToUse = filteredData || processedData;
    
    // Calcular páginas
    const totalPages = Math.ceil(dataToUse.length / rowsPerPage);
    
    // Actualizar información de página
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    
    // Activar/desactivar botones de paginación
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
    
    // Limpiar tabla
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';
    
    // Obtener encabezados
    const headers = Object.keys(dataToUse[0]);
    
    // Añadir encabezados
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        tableHeader.appendChild(th);
    });
    
    // Añadir filas (paginadas)
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, dataToUse.length);
    const pageData = dataToUse.slice(startIndex, endIndex);
    
    pageData.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.dataset.index = startIndex + index; // Guardar índice original
        
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header];
            tr.appendChild(td);
        });
        
        // Añadir evento click para ver detalle
        tr.addEventListener('click', function() {
            showDetailModal(row);
        });
        
        tableBody.appendChild(tr);
    });
}

// Mostrar modal con detalles del registro
function showDetailModal(rowData) {
    const modal = document.getElementById('detailModal');
    const modalContent = document.getElementById('modalContent');
    
    // Limpiar contenido anterior
    modalContent.innerHTML = '';
    
    // Crear tabla de detalle
    const table = document.createElement('table');
    table.className = 'detail-table';
    
    Object.entries(rowData).forEach(([key, value]) => {
        const tr = document.createElement('tr');
        
        const thField = document.createElement('th');
        thField.textContent = key;
        tr.appendChild(thField);
        
        const tdValue = document.createElement('td');
        tdValue.textContent = value;
        tr.appendChild(tdValue);
        
        table.appendChild(tr);
    });
    
    modalContent.appendChild(table);
    modal.style.display = 'block';
}

// Crear tablas de frecuencia para columnas con valores repetidos
function createFrequencyTables() {
    if (!processedData || processedData.length === 0) return;
    
    const frequencyTablesContainer = document.getElementById('frequencyTables');
    frequencyTablesContainer.innerHTML = '';
    
    const headers = Object.keys(processedData[0]).filter(h => h !== 'Código');
    
    headers.forEach(column => {
        // Calcular frecuencias
        const frequencies = {};
        
        processedData.forEach(row => {
            const value = row[column];
            frequencies[value] = (frequencies[value] || 0) + 1;
        });
        
        // Verificar si hay valores repetidos
        const hasRepeatedValues = Object.values(frequencies).some(freq => freq > 1);
        
        if (hasRepeatedValues) {
            // Ordenar frecuencias de mayor a menor
            const sortedFreqs = Object.entries(frequencies)
                .sort((a, b) => b[1] - a[1])
                .filter(([_, count]) => count > 1); // Solo mostrar valores que se repiten
            
            if (sortedFreqs.length === 0) return;
            
            // Crear contenedor para esta tabla de frecuencia
            const freqItem = document.createElement('div');
            freqItem.className = 'frequency-item';
            
            // Título
            const title = document.createElement('h3');
            title.textContent = `Frecuencia de ${column}`;
            freqItem.appendChild(title);
            
            // Tabla
            const table = document.createElement('table');
            table.className = 'frequency-table';
            
            // Encabezados
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            const thValue = document.createElement('th');
            thValue.textContent = column;
            headerRow.appendChild(thValue);
            
            const thFreq = document.createElement('th');
            thFreq.textContent = 'Frecuencia';
            headerRow.appendChild(thFreq);
            
            const thPercentage = document.createElement('th');
            thPercentage.textContent = 'Porcentaje';
            headerRow.appendChild(thPercentage);
            
            const thAction = document.createElement('th');
            thAction.textContent = 'Acción';
            headerRow.appendChild(thAction);
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Cuerpo de la tabla
            const tbody = document.createElement('tbody');
            
            sortedFreqs.forEach(([value, count]) => {
                const tr = document.createElement('tr');
                
                const tdValue = document.createElement('td');
                tdValue.textContent = value;
                tr.appendChild(tdValue);
                
                const tdCount = document.createElement('td');
                tdCount.textContent = count;
                tr.appendChild(tdCount);
                
                const tdPercentage = document.createElement('td');
                const percentage = (count / processedData.length * 100).toFixed(2);
                tdPercentage.textContent = `${percentage}%`;
                tr.appendChild(tdPercentage);
                
                const tdAction = document.createElement('td');
                const seeMoreBtn = document.createElement('button');
                seeMoreBtn.className = 'see-more-btn';
                seeMoreBtn.textContent = 'Ver más';
                seeMoreBtn.addEventListener('click', () => {
                    // Filtrar registros con este valor
                    // Establecer valores de búsqueda
                    document.getElementById('searchInput').value = value;
                    document.getElementById('filterColumn').value = column;
                    
                    // Aplicar filtro
                    filterData();
                    
                    // Asegurar que la sección de resultados sea visible
                    document.getElementById('resultsSection').classList.remove('hidden');
                    
                    // Desplazar la pantalla hacia la tabla de datos
                    const dataTable = document.getElementById('dataTable');
                    if (dataTable) {
                        dataTable.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
                tdAction.appendChild(seeMoreBtn);
                tr.appendChild(tdAction);
                
                tbody.appendChild(tr);
            });
            
            table.appendChild(tbody);
            freqItem.appendChild(table);
            frequencyTablesContainer.appendChild(freqItem);
        }
    });
}

// Crear gráficos de barras para cada columna
function createBarCharts() {
    if (!processedData || processedData.length === 0) return;
    
    // Destruir gráficos existentes
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    
    charts = {}; // Reiniciar objeto de gráficos
    
    const chartsContainer = document.getElementById('chartsContainer');
    chartsContainer.innerHTML = '';
    
    const headers = Object.keys(processedData[0]).filter(h => h !== 'Código');
    
    headers.forEach((column, index) => {
        // Crear contenedor para este gráfico
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        
        const chartTitle = document.createElement('h3');
        chartTitle.textContent = `Gráfico de ${column}`;
        chartContainer.appendChild(chartTitle);
        
        const canvas = document.createElement('canvas');
        canvas.id = `chart_${index}`;
        chartContainer.appendChild(canvas);
        
        chartsContainer.appendChild(chartContainer);
        
        // Determinar si es columna numérica o categórica
        const isNumeric = processedData.every(row => !isNaN(parseFloat(row[column])));
        
        if (isNumeric) {
            createNumericBarChart(canvas.id, column);
        } else {
            createCategoricalBarChart(canvas.id, column);
        }
    });
}

// Crear gráfico de barras para datos numéricos
function createNumericBarChart(canvasId, column) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Agrupar valores numéricos en intervalos
    const values = processedData.map(row => parseFloat(row[column]));
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Determinar el número de intervalos (bins)
    const binCount = Math.min(10, Math.ceil(Math.sqrt(values.length)));
    const binSize = (max - min) / binCount;
    
    const bins = Array(binCount).fill(0);
    const binLabels = [];
    
    // Crear etiquetas para los intervalos
    for (let i = 0; i < binCount; i++) {
        const start = min + i * binSize;
        const end = min + (i + 1) * binSize;
        binLabels.push(`${start.toFixed(2)} - ${end.toFixed(2)}`);
    }
    
    // Contar valores en cada intervalo
    values.forEach(value => {
        if (value === max) {
            // El valor máximo va en el último bin
            bins[binCount - 1]++;
        } else {
            const binIndex = Math.floor((value - min) / binSize);
            bins[binIndex]++;
        }
    });
    
    charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: binLabels,
            datasets: [{
                label: `Distribución de ${column}`,
                data: bins,
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
                    },
                    ticks: {
                        display: false
                    }
                }
            }
        }
    });
}

// Crear gráfico de barras para datos categóricos
function createCategoricalBarChart(canvasId, column) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Contar frecuencias por categoría
    const freqMap = {};
    processedData.forEach(row => {
        const value = row[column];
        freqMap[value] = (freqMap[value] || 0) + 1;
    });
    
    // Ordenar por frecuencia (de mayor a menor)
    const sortedEntries = Object.entries(freqMap)
        .sort((a, b) => b[1] - a[1]);
    
    // Limitar a 15 categorías más frecuentes para mantener legibilidad
    const topEntries = sortedEntries.slice(0, 15);
    const labels = topEntries.map(entry => entry[0]);
    const data = topEntries.map(entry => entry[1]);
    
    charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Frecuencia de ${column}`,
                data: data,
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
                    text: `Categorías más frecuentes de ${column}`
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
                    },
                    ticks: {
                        display: false
                    }
                }
            }
        }
    });
}

// Generar análisis de resultados
// Versión corregida de la función generateAnalysis
function generateAnalysis() {
    if (!processedData || processedData.length === 0) return;
    
    const analysisContent = document.getElementById('analysisContent');
    const headers = Object.keys(processedData[0]).filter(h => h !== 'Código');
    
    // Identificar columnas numéricas y categóricas
    const numericColumns = headers.filter(header => {
        try {
            return processedData.every(row => !isNaN(parseFloat(row[header])));
        } catch (e) {
            console.error("Error al analizar columna", header, e);
            return false;
        }
    });
    
    const categoricalColumns = headers.filter(header => 
        !numericColumns.includes(header)
    );
    
    // Generar análisis estadístico básico
    let analysis = '<h3>Resumen del Análisis</h3>';
    
    // Información general
    analysis += `<p>Se han analizado <strong>${processedData.length}</strong> registros con <strong>${headers.length}</strong> variables.</p>`;
    
    // Análisis de valores repetidos
    const valueFrequencyMap = {};
    
    headers.forEach(column => {
        try {
            valueFrequencyMap[column] = {};
            
            processedData.forEach(row => {
                const value = row[column];
                valueFrequencyMap[column][value] = (valueFrequencyMap[column][value] || 0) + 1;
            });
        } catch (e) {
            console.error("Error al analizar frecuencias para columna", column, e);
        }
    });
    
    // Encontrar valores más comunes
    analysis += '<h3>Valores Más Frecuentes</h3>';
    analysis += '<ul>';
    
    headers.forEach(column => {
        try {
            const freqMap = valueFrequencyMap[column];
            if (!freqMap) return;
            
            const sortedValues = Object.keys(freqMap).sort((a, b) => freqMap[b] - freqMap[a]);
            
            if (sortedValues.length > 0) {
                const topValue = sortedValues[0];
                const frequency = freqMap[topValue];
                const percentage = ((frequency / processedData.length) * 100).toFixed(1);
                
                // Añadir botón "Ver más" para cada valor más común
                analysis += `<li>
                    El valor más común en <strong>${column}</strong> es <strong>${topValue}</strong>, 
                    apareciendo <strong>${frequency}</strong> veces (${percentage}% del total).
                    <button class="see-more-btn" onclick="showValueRecords('${column}', '${topValue}')">Ver más</button>
                </li>`;
            }
        } catch (e) {
            console.error("Error al analizar valor más común para columna", column, e);
        }
    });
    
    analysis += '</ul>';
    
    // ==================== ANÁLISIS IA AVANZADO =====================
    // Tendencias identificadas con IA
    analysis += '<h3>Tendencias Identificadas</h3>';

    // Análisis de tendencias temporales si existe alguna columna que pueda ser temporal
    const possibleTimeColumns = headers.filter(col => 
        col.toLowerCase().includes('fecha') || 
        col.toLowerCase().includes('año') || 
        col.toLowerCase().includes('mes') || 
        col.toLowerCase().includes('time') || 
        col.toLowerCase().includes('year') || 
        col.toLowerCase().includes('date')
    );

    // Análisis de tendencias numéricas
    if (numericColumns.length > 0) {
        try {
            numericColumns.forEach(column => {
                try {
                    const values = processedData.map(row => parseFloat(row[column]));
                    
                    // Estadísticas básicas
                    const sum = values.reduce((a, b) => a + b, 0);
                    const mean = sum / values.length;
                    
                    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
                    const variance = squaredDifferences.reduce((a, b) => a + b, 0) / values.length;
                    const stdDev = Math.sqrt(variance);
                    
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
                        
                        if (increasingPercentage > 65) {
                            analysis += `<p>En <strong>${column}</strong> se observa una <strong>tendencia claramente ascendente</strong> con un ${increasingPercentage.toFixed(1)}% de cambios positivos. Esto podría indicar un crecimiento sostenido que merece atención para estrategias de inversión o desarrollo.</p>`;
                        } else if (increasingPercentage > 55) {
                            analysis += `<p>En <strong>${column}</strong> hay una <strong>ligera tendencia al alza</strong> (${increasingPercentage.toFixed(1)}% de cambios positivos), aunque no es completamente definitiva y puede estar sujeta a fluctuaciones a corto plazo.</p>`;
                        } else if (increasingPercentage < 35) {
                            analysis += `<p>En <strong>${column}</strong> se identifica una <strong>tendencia claramente decreciente</strong> con un ${(100 - increasingPercentage).toFixed(1)}% de cambios negativos, lo que podría requerir medidas correctivas o reconsiderar estrategias actuales.</p>`;
                        } else if (increasingPercentage < 45) {
                            analysis += `<p>En <strong>${column}</strong> existe una <strong>ligera tendencia a la baja</strong> (${(100 - increasingPercentage).toFixed(1)}% de cambios negativos), que debe monitorearse pero que aún no representa una caída definitiva.</p>`;
                        } else {
                            analysis += `<p>Los valores de <strong>${column}</strong> muestran un <strong>comportamiento estable</strong> sin una dirección clara, con aproximadamente el mismo número de incrementos y decrementos, lo que sugiere un mercado o sistema en equilibrio.</p>`;
                        }
                    }
                    
                    // Detección simple de valores atípicos
                    const outliers = values.filter(value => Math.abs(value - mean) > 2 * stdDev);
                    
                    if (outliers.length > 0) {
                        const outlierPercentage = (outliers.length / values.length) * 100;
                        analysis += `<p>Se identificaron <strong>${outliers.length}</strong> valores atípicos (${outlierPercentage.toFixed(1)}% del total) en <strong>${column}</strong>, que podrían representar anomalías o oportunidades específicas que requieren atención.</p>`;
                    } else {
                        analysis += `<p>No se identificaron valores atípicos significativos en <strong>${column}</strong>, lo que indica una distribución homogénea dentro de los rangos esperados.</p>`;
                    }
                } catch (e) {
                    console.error("Error en análisis numérico para columna", column, e);
                }
            });
        } catch (e) {
            console.error("Error general en análisis numérico", e);
        }
    }
    
    // Análisis de correlaciones entre variables numéricas
    if (numericColumns.length >= 2) {
        try {
            let strongCorrelations = [];
            
            for (let i = 0; i < numericColumns.length; i++) {
                for (let j = i + 1; j < numericColumns.length; j++) {
                    try {
                        const col1 = numericColumns[i];
                        const col2 = numericColumns[j];
                        
                        const values1 = processedData.map(row => parseFloat(row[col1]));
                        const values2 = processedData.map(row => parseFloat(row[col2]));
                        
                        const correlation = calculateCorrelation(values1, values2);
                        
                        if (Math.abs(correlation) > 0.5) {
                            strongCorrelations.push({
                                columns: [col1, col2],
                                value: correlation
                            });
                        }
                    } catch (e) {
                        console.error(`Error al calcular correlación entre ${numericColumns[i]} y ${numericColumns[j]}`, e);
                    }
                }
            }
            
            // Mostrar la correlación más fuerte encontrada
            if (strongCorrelations.length > 0) {
                // Ordenar por valor absoluto de correlación
                strongCorrelations.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
                
                const strongest = strongCorrelations[0];
                const correlationType = strongest.value > 0 ? "positiva" : "negativa";
                analysis += `<p>Se detectó una <strong>correlación ${correlationType}</strong> (${strongest.value.toFixed(2)}) entre <strong>${strongest.columns[0]}</strong> y <strong>${strongest.columns[1]}</strong>, lo que indica una relación significativa entre estas variables.</p>`;
            }
        } catch (e) {
            console.error("Error en análisis de correlaciones", e);
        }
    }
    
    // Análisis de categorías principales
    if (categoricalColumns.length > 0) {
        try {
            // Encontrar la categoría con mayor desequilibrio en sus valores
            categoricalColumns.forEach(column => {
                try {
                    const freqMap = valueFrequencyMap[column];
                    if (!freqMap) return;
                    
                    const sortedEntries = Object.entries(freqMap)
                        .sort((a, b) => b[1] - a[1]);
                    
                    if (sortedEntries.length > 1) {
                        const [topCategory, topCount] = sortedEntries[0];
                        const topPercentage = (topCount / processedData.length * 100).toFixed(1);
                        
                        if (parseFloat(topPercentage) > 60) {
                            analysis += `<p>En la variable <strong>${column}</strong>, la categoría <strong>"${topCategory}"</strong> es claramente dominante con un ${topPercentage}% del total. Esta concentración tan marcada sugiere un patrón significativo que caracteriza la mayor parte de los datos.</p>`;
                        }
                    }
                } catch (e) {
                    console.error("Error en análisis de categoría", column, e);
                }
            });
        } catch (e) {
            console.error("Error general en análisis de categorías", e);
        }
    }
    
    // Análisis temporal si existe una columna de tiempo
    if (possibleTimeColumns.length > 0) {
        try {
            const timeColumn = possibleTimeColumns[0];
            
            if (numericColumns.length > 0) {
                const numCol = numericColumns[0];
                analysis += `<p>Al analizar <strong>${numCol}</strong> a lo largo del tiempo según <strong>${timeColumn}</strong>, se pueden identificar patrones evolutivos que podrían indicar tendencias futuras. Se recomienda un seguimiento continuo de estas variables temporales.</p>`;
            }
        } catch (e) {
            console.error("Error en análisis temporal", e);
        }
    }
    
    // Conclusiones y recomendaciones inteligentes basadas en el análisis
    analysis += '<h3>Conclusiones y Recomendaciones</h3>';
    
    // Generar conclusiones específicas según el tipo de datos y patrones encontrados
    let conclusions = '<p>Basado en el análisis detallado de los datos proporcionados, se pueden extraer las siguientes conclusiones e insights accionables:</p>';
    conclusions += '<ul>';
    
    // Conclusiones sobre distribución de datos
    if (numericColumns.length > 0) {
        try {
            const mainNumCol = numericColumns[0];
            conclusions += `<li>Los datos analizados de <strong>${mainNumCol}</strong> muestran patrones que sugieren comportamientos específicos del mercado o segmento analizado, con oportunidades para estrategias diferenciadas según los segmentos identificados.</li>`;
        } catch (e) {
            console.error("Error en conclusiones numéricas", e);
        }
    }
    
    // Conclusiones sobre segmentos y categorías
    if (categoricalColumns.length > 0) {
        try {
            const mainCatCol = categoricalColumns[0];
            conclusions += `<li>La segmentación por <strong>${mainCatCol}</strong> revela preferencias claras que pueden aprovecharse para optimizar estrategias específicas y focalizar esfuerzos en los segmentos más relevantes.</li>`;
        } catch (e) {
            console.error("Error en conclusiones categóricas", e);
        }
    }
    
    // Recomendaciones específicas y accionables
    conclusions += `<li>Se recomienda profundizar el análisis en los segmentos destacados, principalmente en aquellos que muestran comportamientos atípicos o que representan oportunidades de crecimiento basadas en los patrones identificados.</li>`;
    
    // Recomendación adaptativa sobre datos
    conclusions += `<li>Para un análisis más completo y detallado, se sugiere incorporar variables adicionales que puedan enriquecer la comprensión de las relaciones entre los factores analizados y aporten nuevas dimensiones al estudio.</li>`;
    
    conclusions += `<li>El monitoreo continuo de estos indicadores permitirá identificar cambios en las tendencias observadas y ajustar estrategias de manera oportuna ante variaciones significativas del mercado o comportamiento de los datos.</li>`;
    
    conclusions += '</ul>';
    
    analysis += conclusions;
    
    analysisContent.innerHTML = analysis;

    // Añadir función global para manejar los botones "Ver más"
    window.showValueRecords = function(column, value) {
        // Establecer valores de búsqueda
        document.getElementById('searchInput').value = value;
        document.getElementById('filterColumn').value = column;
        
        // Aplicar filtro
        filterData();
        
        // Asegurar que la sección de resultados sea visible
        document.getElementById('resultsSection').classList.remove('hidden');
        
        // Desplazar la pantalla hacia la tabla de datos
        const dataTable = document.getElementById('dataTable');
        if (dataTable) {
            dataTable.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };
}

// Función auxiliar simplificada para calcular correlación
function calculateCorrelation(array1, array2) {
    try {
        if (!array1 || !array2 || array1.length !== array2.length || array1.length === 0) {
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
            
            if (isNaN(x) || isNaN(y)) continue;
            
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
    } catch (e) {
        console.error("Error en cálculo de correlación", e);
        return 0;
    }
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
    element.download = `analisis_tendencias_${new Date().getTime()}.txt`;
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
                filteredData = null;
                currentPage = 1;
                
                // Mostrar datos en la interfaz
                populateFilterOptions();
                renderTableData();
                createFrequencyTables();
                createBarCharts();
                
                // Restaurar análisis
                document.getElementById('analysisContent').innerHTML = project.analysis;
                
                // Mostrar sección de resultados
                document.getElementById('loadingSection').classList.add('hidden');
                document.getElementById('resultsSection').classList.remove('hidden');
                
                // Ocultar gestor de proyectos
                document.getElementById('projectsManager').classList.add('hidden');
                
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
// Ocultar splash screen después de cargar
setTimeout(() => {
    const splash = document.getElementById('splashScreen');
    splash.style.opacity = 0;
    setTimeout(() => splash.style.display = 'none', 1000);
}, 1500); // dura 1.5 segundos
