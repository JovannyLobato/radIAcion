import { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface RadiacionData {
    fechas: string[];
    direct_normal_irradiance: (number | null)[];
    direct_radiation: (number | null)[];
    direct_radiation_instant: (number | null)[];

    fechas_prediccion: string[];
    predicciones: {
        direct_normal_irradiance: number[];
        direct_radiation: number[];
        direct_radiation_instant: number[];
    };
}

interface PuntoGrafica {
    timestamp: number;
    fechaCompleta: string;
    fechaHora: string;

    // Datos históricos
    DNI: number | null;
    Directa: number | null;
    Instantanea: number | null;

    // Predicciones de las tres variables
    DNIPrediccion: number | null;
    DirectaPrediccion: number | null;
    InstantaneaPrediccion: number | null;
}

interface GraficaProps {
    coordenadas: [number, number];
}

const formatearFecha = (fecha: string): Date => {
    const [parteFecha, parteHora = '00:00'] = fecha.split(' ');
    const [anio, mes, dia] = parteFecha.split('-').map(Number);
    const [hora, minuto] = parteHora.split(':').map(Number);

    return new Date(anio, mes - 1, dia, hora, minuto);
};

const formatoDia = (fecha: Date) =>
    fecha.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
    });

const formatoFechaHora = (fecha: Date) =>
    fecha.toLocaleString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

const formatearValor = (valor: number | null | undefined) => {
    if (valor == null || !Number.isFinite(valor)) {
        return 'Sin datos';
    }

    return `${valor.toLocaleString('es-MX', {
        maximumFractionDigits: 2,
    })} W/m²`;
};

const TooltipRadiacion = ({
    active,
    payload,
}: {
    active?: boolean;
    payload?: Array<{ payload: PuntoGrafica }>;
}) => {
    if (!active || !payload?.length) return null;

    const punto = payload[0].payload;
    if (!punto) return null;

    const hayHistoricos =
        punto.DNI != null ||
        punto.Directa != null ||
        punto.Instantanea != null;

    const hayPredicciones =
        punto.DNIPrediccion != null ||
        punto.DirectaPrediccion != null ||
        punto.InstantaneaPrediccion != null;

    return (
        <div
            style={{
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                fontSize: '13px',
            }}
        >
            <p style={{ margin: '0 0 10px', fontWeight: 'bold' }}>
                {punto.fechaHora}
            </p>

            {hayHistoricos && (
                <>
                    <p style={{ fontWeight: 'bold', margin: '8px 0' }}>
                        Datos históricos
                    </p>

                    <p style={{ color: '#ff7300', margin: '5px 0' }}>
                        DNI: {formatearValor(punto.DNI)}
                    </p>

                    <p style={{ color: '#387908', margin: '5px 0' }}>
                        Radiación directa: {formatearValor(punto.Directa)}
                    </p>

                    <p style={{ color: '#3596dc', margin: '5px 0' }}>
                        Radiación instantánea: {formatearValor(punto.Instantanea)}
                    </p>
                </>
            )}

            {/* Predicciones de las tres variables de IA */}
            {hayPredicciones && (
                <>
                    <p style={{ fontWeight: 'bold', margin: '12px 0 8px' }}>
                        Predicción del modelo IA
                    </p>

                    <p style={{ color: '#ff7300', margin: '5px 0' }}>
                        DNI prevista: {formatearValor(punto.DNIPrediccion)}
                    </p>

                    <p style={{ color: '#387908', margin: '5px 0' }}>
                        Radiación directa prevista: {formatearValor(punto.DirectaPrediccion)}
                    </p>

                    <p style={{ color: '#3596dc', margin: '5px 0' }}>
                        Radiación instantánea prevista: {formatearValor(punto.InstantaneaPrediccion)}
                    </p>
                </>
            )}
        </div>
    );
};

export const GraficaRadiacion = ({ coordenadas }: GraficaProps) => {
    const [dataGrafica, setDataGrafica] = useState<PuntoGrafica[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [mostrarDNI, setMostrarDNI] = useState(true);
    const [mostrarDirecta, setMostrarDirecta] = useState(true);
    const [mostrarInstantanea, setMostrarInstantanea] = useState(true);

    const todasActivas =
        mostrarDNI && mostrarDirecta && mostrarInstantanea;

    const toggleTodas = () => {
        const nuevoEstado = !todasActivas;
        setMostrarDNI(nuevoEstado);
        setMostrarDirecta(nuevoEstado);
        setMostrarInstantanea(nuevoEstado);
    };

    useEffect(() => {
        const controller = new AbortController();

        const cargarDatos = async () => {
            setLoading(true);
            setError('');

            try {
                const [lat, lng] = coordenadas;

                const respuesta = await fetch(
                    `http://127.0.0.1:8000/api/radiacion?latitude=${lat}&longitude=${lng}`,
                    { signal: controller.signal }
                );

                if (!respuesta.ok) {
                    throw new Error(
                        `Error HTTP: ${respuesta.status}`
                    );
                }

                const data: RadiacionData = await respuesta.json();

                if (
                    !Array.isArray(data.fechas) ||
                    !Array.isArray(data.direct_normal_irradiance) ||
                    !Array.isArray(data.direct_radiation) ||
                    !Array.isArray(data.direct_radiation_instant)
                ) {
                    throw new Error(
                        'La API no devolvió todas las series históricas esperadas.'
                    );
                }

                const obtenerValor = (
                    valor: number | null | undefined
                ): number | null => {
                    if (valor == null || !Number.isFinite(Number(valor))) {
                        return null;
                    }

                    return Number(valor);
                };

                const historicos: PuntoGrafica[] = data.fechas.map(
                    (fechaStr, index) => {
                        const fecha = formatearFecha(fechaStr);

                        return {
                            timestamp: fecha.getTime(),
                            fechaCompleta: fechaStr,
                            fechaHora: formatoFechaHora(fecha),

                            DNI: obtenerValor(
                                data.direct_normal_irradiance[index]
                            ),
                            Directa: obtenerValor(
                                data.direct_radiation[index]
                            ),
                            Instantanea: obtenerValor(
                                data.direct_radiation_instant[index]
                            ),

                            DNIPrediccion: null,
                            DirectaPrediccion: null,
                            InstantaneaPrediccion: null,
                        };
                    }
                );

                const predicciones: PuntoGrafica[] = (
                    data.fechas_prediccion ?? []
                ).map((fechaStr, index) => {
                    const fecha = formatearFecha(fechaStr);

                    return {
                        timestamp: fecha.getTime(),
                        fechaCompleta: fechaStr,
                        fechaHora: formatoFechaHora(fecha),

                        DNI: null,
                        Directa: null,
                        Instantanea: null,

                        // Las tres predicciones de IA restauradas
                        DNIPrediccion: obtenerValor(
                            data.predicciones?.direct_normal_irradiance?.[index]
                        ),
                        DirectaPrediccion: obtenerValor(
                            data.predicciones?.direct_radiation?.[index]
                        ),
                        InstantaneaPrediccion: obtenerValor(
                            data.predicciones?.direct_radiation_instant?.[index]
                        ),
                    };
                });

                const todosLosDatos = [...historicos, ...predicciones]
                    .sort((a, b) => a.timestamp - b.timestamp);

                setDataGrafica(todosLosDatos);

            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') {
                    return;
                }

                console.error('Error al obtener radiación:', err);
                setError(
                    err instanceof Error
                        ? err.message
                        : 'No se pudieron cargar los datos.'
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        cargarDatos();

        return () => controller.abort();
    }, [coordenadas]);

    const tabStyle = (activo: boolean, colorBase: string) => ({
        padding: '10px 16px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: activo ? '600' : '400',
        backgroundColor: activo ? '#fff' : '#f8f9fa',
        color: activo ? colorBase : '#6c757d',
        border: '1px solid #dee2e6',
        borderBottom: activo
            ? `2px solid ${colorBase}`
            : '1px solid #dee2e6',
        borderTopLeftRadius: '6px',
        borderTopRightRadius: '6px',
        boxShadow: activo
            ? '0 -2px 5px rgba(0,0,0,0.05)'
            : 'none',
        transition: 'all 0.2s ease',
        marginBottom: '-1px',
    } as const);

    if (loading) {
        return (
            <div style={{
                background: '#fff',
                padding: '40px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                minHeight: '250px'
            }}>

                {/* Círculo de carga giratorio */}
                <div style={{
                    width: '36px',
                    height: '36px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #3596dc',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                    Cargando gráfica de radiación y predicciones...
                </p>

                {/* Definición de la animación keyframes en línea */}
                <style>
                    {`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}
                </style>
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    padding: '16px',
                    color: '#b42318',
                    background: '#fff',
                    borderRadius: '8px',
                }}
            >
                <strong>No se pudo cargar la gráfica.</strong>
                <p>{error}</p>
            </div>
        );
    }

    if (!dataGrafica.length) {
        return <p>La API no devolvió datos históricos.</p>;
    }



    return (
        <div
            style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
        >
            <h3>
                Comportamiento de Irradiancia y Radiación Solar (W/m²)
            </h3>

            {(() => {
                const siguienteDia = dataGrafica.find(p => p.DNIPrediccion != null || p.DirectaPrediccion != null || p.InstantaneaPrediccion != null);
                if (!siguienteDia) return null;

                return (
                    <div style={{
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '13px',
                        color: '#166534',
                        marginBottom: '15px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}>
                        <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Pronóstico del Siguiente Día: {siguienteDia.fechaHora.split(',')[0]}
                        </div>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            <span style={{ color: '#ff7300' }}><strong>DNI prevista:</strong> {formatearValor(siguienteDia.DNIPrediccion)}</span>
                            <span style={{ color: '#387908' }}><strong>Directa prevista:</strong> {formatearValor(siguienteDia.DirectaPrediccion)}</span>
                            <span style={{ color: '#3596dc' }}><strong>Instantánea prevista:</strong> {formatearValor(siguienteDia.InstantaneaPrediccion)}</span>
                        </div>
                    </div>
                );
            })()}
            <div
                style={{
                    display: 'flex',
                    gap: '4px',
                    borderBottom: '1px solid #dee2e6',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                }}
            >
                <button
                    onClick={toggleTodas}
                    style={tabStyle(todasActivas, '#212529')}
                >
                    {todasActivas ? 'Ocultar todas' : 'Mostrar todas'}
                </button>

                <button
                    onClick={() => setMostrarDNI(!mostrarDNI)}
                    style={tabStyle(mostrarDNI, '#ff7300')}
                >
                    Irradiancia normal directa (DNI)
                </button>

                <button
                    onClick={() => setMostrarDirecta(!mostrarDirecta)}
                    style={tabStyle(mostrarDirecta, '#387908')}
                >
                    Radiación solar directa
                </button>

                <button
                    onClick={() =>
                        setMostrarInstantanea(!mostrarInstantanea)
                    }
                    style={tabStyle(mostrarInstantanea, '#3596dc')}
                >
                    Radiación solar directa (instantánea)
                </button>
            </div>

            <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={dataGrafica}
                        margin={{
                            top: 10,
                            right: 20,
                            left: 10,
                            bottom: 10,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis
                            dataKey="timestamp"
                            type="number"
                            scale="time"
                            domain={['dataMin', 'dataMax']}
                            ticks={dataGrafica
                                .filter((punto, index, arreglo) => {
                                    if (index === 0) return true;

                                    const fechaActual = new Date(punto.timestamp);
                                    const fechaAnterior = new Date(arreglo[index - 1].timestamp);

                                    return fechaActual.toDateString() !== fechaAnterior.toDateString();
                                })
                                .map(punto => punto.timestamp)}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(valor: number) =>
                                formatoDia(new Date(valor))
                            }
                            interval={0}
                        />

                        <YAxis
                            tick={{ fontSize: 12 }}
                            label={{
                                value: 'W/m²',
                                angle: -90,
                                position: 'insideLeft',
                                style: {
                                    textAnchor: 'middle',
                                    fill: '#666',
                                    fontSize: 14,
                                },
                            }}
                        />

                        <Tooltip content={<TooltipRadiacion />} />

                        <Legend />

                        {/* Líneas Históricas */}
                        {mostrarDNI && (
                            <Line
                                type="monotone"
                                dataKey="DNI"
                                name="DNI"
                                stroke="#ff7300"
                                dot={false}
                                connectNulls={false}
                                isAnimationActive={false}
                            />
                        )}

                        {mostrarDirecta && (
                            <Line
                                type="monotone"
                                dataKey="Directa"
                                name="Directa"
                                stroke="#387908"
                                dot={false}
                                connectNulls={false}
                                isAnimationActive={false}
                            />
                        )}

                        {mostrarInstantanea && (
                            <Line
                                type="monotone"
                                dataKey="Instantanea"
                                name="Instantánea"
                                stroke="#3596dc"
                                dot={false}
                                connectNulls={false}
                                isAnimationActive={false}
                            />
                        )}

                        {/* Líneas de Predicción de IA (Restauradas las 3) */}
                        {mostrarDNI && (
                            <Line
                                type="monotone"
                                dataKey="DNIPrediccion"
                                name="DNI prevista (IA)"
                                stroke="#ff7300"
                                strokeDasharray="6 4"
                                dot={false}
                                connectNulls={false}
                                isAnimationActive={false}
                            />
                        )}

                        {mostrarDirecta && (
                            <Line
                                type="monotone"
                                dataKey="DirectaPrediccion"
                                name="Radiación directa prevista (IA)"
                                stroke="#387908"
                                strokeDasharray="6 4"
                                dot={false}
                                connectNulls={false}
                                isAnimationActive={false}
                            />
                        )}

                        {mostrarInstantanea && (
                            <Line
                                type="monotone"
                                dataKey="InstantaneaPrediccion"
                                name="Radiación instantánea prevista (IA)"
                                stroke="#3596dc"
                                strokeDasharray="6 4"
                                dot={false}
                                connectNulls={false}
                                isAnimationActive={false}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};