import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RadiacionData {
    fechas: string[];
    direct_normal_irradiance: number[];
    direct_radiation: number[];
    direct_radiation_instant: number[];
}

export const GraficaRadiacion = () => {
    const [dataGrafica, setDataGrafica] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Estados para controlar qué líneas se muestran
    const [mostrarDNI, setMostrarDNI] = useState<boolean>(true);
    const [mostrarDirecta, setMostrarDirecta] = useState<boolean>(true);
    const [mostrarInstantanea, setMostrarInstantanea] = useState<boolean>(false);

    // Verificar si todas están activas para la pestaña maestra
    const todasActivas = mostrarDNI && mostrarDirecta && mostrarInstantanea;
    const toggleTodas = () => {
        const nuevoEstado = !todasActivas;
        setMostrarDNI(nuevoEstado);
        setMostrarDirecta(nuevoEstado);
        setMostrarInstantanea(nuevoEstado);
    };

    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/radiacion')
            .then((res) => res.json())
            .then((data: RadiacionData) => {
                let ultimoDiaVisto = "";

                const formattedData = data.fechas.map((fechaStr, index) => {
                    const fechaObj = new Date(fechaStr);

                    const etiquetaDia = fechaObj.toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                    });

                    const fechaHoraCompleta = fechaObj.toLocaleString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                    });

                    let etiquetaEjeX = "";
                    if (etiquetaDia !== ultimoDiaVisto) {
                        ultimoDiaVisto = etiquetaDia;
                        etiquetaEjeX = etiquetaDia;
                    } else {
                        etiquetaEjeX = "";
                    }

                    return {
                        tiempoEjeX: etiquetaEjeX,         
                        tiempoCompleto: fechaHoraCompleta,  
                        DNI: Math.round(data.direct_normal_irradiance[index]),
                        Directa: Math.round(data.direct_radiation[index]),
                        Instantanea: Math.round(data.direct_radiation_instant[index]),
                    };
                });

                setDataGrafica(formattedData);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error al obtener datos de radiación:', err);
                setLoading(false);
            });
    }, []);

    if (loading) return <p>Cargando gráfica de radiación...</p>;

    // Estilo base compartido para las pestañas
    const tabStyle = (activo: boolean, colorBase: string) => ({
        padding: '10px 16px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: activo ? '600' : '400',
        backgroundColor: activo ? '#fff' : '#f8f9fa',
        color: activo ? colorBase : '#6c757d',
        border: '1px solid #dee2e6',
        borderBottom: activo ? '2px solid ' + colorBase : '1px solid #dee2e6',
        borderTopLeftRadius: '6px',
        borderTopRightRadius: '6px',
        boxShadow: activo ? '0 -2px 5px rgba(0,0,0,0.05)' : 'none',
        transition: 'all 0.2s ease',
        marginBottom: '-1px', // Alinea el borde inferior con el contenedor
    });

    return (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3>Comportamiento de Irradiancia y Radiación Solar (W/m²)</h3>

            {/* Contenedor estilo Pestañas / Tabs */}
            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #dee2e6', marginBottom: '20px', flexWrap: 'wrap' }}>
                {/* Pestaña Maestra */}
                <button
                    onClick={toggleTodas}
                    style={tabStyle(todasActivas, '#212529')}
                >
                    {todasActivas ? 'Ocultar todas' : 'Mostrar todas'}
                </button>

                {/* Pestaña DNI */}
                <button
                    onClick={() => setMostrarDNI(!mostrarDNI)}
                    style={tabStyle(mostrarDNI, '#ff7300')}
                >
                    Irradiancia normal directa (DNI)
                </button>

                {/* Pestaña Radiación Directa */}
                <button
                    onClick={() => setMostrarDirecta(!mostrarDirecta)}
                    style={tabStyle(mostrarDirecta, '#387908')}
                >
                    Radiación solar directa
                </button>

                {/* Pestaña Radiación Instantánea */}
                <button
                    onClick={() => setMostrarInstantanea(!mostrarInstantanea)}
                    style={tabStyle(mostrarInstantanea, '#3596dcff')}
                >
                    Radiación solar directa (instantánea)
                </button>
            </div>

            {/* Gráfica */}
            <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                    <LineChart data={dataGrafica}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            label={{
                                value: 'W/m²',
                                angle: -90,
                                position: 'insideLeft',
                                style: { textAnchor: 'middle', fill: '#666', fontSize: 14 }
                            }} 
                        />
                        <XAxis dataKey="tiempoEjeX" tick={{ fontSize: 12 }} interval={0} />
                        <Tooltip
                            labelFormatter={(label, payload) => {
                                if (payload && payload.length > 0) {
                                    return payload[0].payload.tiempoCompleto;
                                }
                                return label;
                            }}
                        />
                        
                        
                        <Legend />
                        {mostrarDNI && <Line type="monotone" dataKey="DNI" stroke="#ff7300" dot={false}  />}
                        {mostrarDirecta && <Line type="monotone" dataKey="Directa" stroke="#387908" dot={false} name="Directa" />}
                        {mostrarInstantanea && <Line type="monotone" dataKey="Instantanea" stroke="#3596dcff" dot={false} name="Instantánea" />}
                        
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};