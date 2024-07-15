const express = require('express');
const cors = require('cors');
const connectToDatabase = require('./db');
const moment = require('moment');
const PORT = process.env.PORT || 5000;
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/turnos/reservar', async (req, res) => {
    const { fecha, hora, nombreCliente, tipoServicio, montoSeña, emailCliente } = req.body;

    try {
        const db = await connectToDatabase();
        const turnosCollection = db.collection('turnos');

        const turnoExistente = await turnosCollection.findOne({ fecha, hora });
        if (turnoExistente) {
            return res.status(400).json({ message: 'El turno para esta fecha y hora ya está reservado' });
        }

        const montoSeñaNumero = Number(montoSeña);
        if (isNaN(montoSeñaNumero)) {
            throw new Error('montoSeña debe ser un número');
        }

        // Insertar el turno reservado
        await turnosCollection.insertOne({
            fecha,
            hora,
            nombreCliente,
            tipoServicio,
            emailCliente,
            montoSeña: montoSeñaNumero,
            disponible: false, // Marcamos el turno como no disponible al reservarlo
        });

        const fechaFormateada = moment(fecha, hora).format('DD-MM-YYYY HH:mm');
        console.log(`El cliente ${nombreCliente} reservó el turno para el día ${fechaFormateada} y para el servicio ${tipoServicio}.`);

        res.status(201).json({ message: 'Turno reservado exitosamente' });
    } catch (err) {
        console.error('Error al reservar el turno:', err);
        res.status(500).json({ message: 'Error interno al procesar la solicitud' });
    }
});

app.get('/turnos/horarios-disponibles', async (req, res) => {
    const { fecha } = req.query;

    if (!fecha) {
        return res.status(400).json({ message: 'Fecha es requerida' });
    }

    try {
        const db = await connectToDatabase();
        const turnosCollection = db.collection('turnos');

        const turnos = await turnosCollection.find({ fecha }).toArray();
        const horariosDisponibles = obtenerHorariosDisponibles(moment(fecha).format('dddd'));

        const horariosDisponiblesFiltrados = horariosDisponibles.filter(hora => {
            const turnoReservado = turnos.find(turno => turno.hora === hora && turno.disponible === false);
            return !turnoReservado;
        });

        console.log('Horarios disponibles filtrados:', horariosDisponiblesFiltrados);

        res.status(200).json(horariosDisponiblesFiltrados);
    } catch (err) {
        console.error('Error al obtener horarios disponibles:', err);
        res.status(500).json({ message: 'Error interno al procesar la solicitud' });
    }
});

const obtenerHorariosDisponibles = (diaSemana) => {
    const horariosDisponibles = {
        "Monday": ["09:00", "11:30", "13:30", "17:30"],
        "Tuesday": ["09:00", "11:30", "15:00", "18:00"],
        "Wednesday": ["09:00", "11:30", "13:30", "17:30"],
        "Thursday": ["09:00", "11:30", "15:00", "18:00"],
        "Friday": ["09:00", "11:30", "13:00", "15:00", "18:00"],
        "Saturday": ["10:00", "12:30", "15:00"],
    };

    return horariosDisponibles[diaSemana] || [];
};

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
