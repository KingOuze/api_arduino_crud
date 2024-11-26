const Mesure = require("../models/Mesure"); // Import du modèle Mongoose "Mesure"

const getWeeklyRecords = async (req, res) => {
    try {
        // Obtenir la date actuelle
        const today = new Date();
        // Trouver le premier jour de la semaine (lundi)
        const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
        // Trouver le dernier jour de la semaine (dimanche)
        const lastDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 7));

        // Récupérer les enregistrements de la semaine en utilisant le modèle Mongoose "Mesure"
        const records = await Mesure.find({
            date: {
                $gte: firstDayOfWeek,
                $lte: lastDayOfWeek
            }
        }).sort({ date: 1 }); // Tri par date croissante

        if (records.length > 0) {
            res.status(200).json(records);
        } else {
            res.status(204).json({ msg: "Aucun enregistrement trouvé pour cette semaine." });
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des enregistrements :", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

const storeRecord = async (req, res) => {
    try {
        const { temperature, humidity } = req.body;

        // Validation des données
        if (!temperature || !humidity) {
            return res.status(400).json({ msg: "Données incomplètes" });
        }

       
        // Création d'un nouvel enregistrement avec le modèle Mongoose "Mesure"
        const newRecord = new Mesure({
            temperature,
            humidity
        });

        // Sauvegarde dans la base de données en utilisant le modèle Mongoose "Mesure"
        await newRecord.save();

        // Réponse de succès
        res.status(201).json({ msg: "Enregistrement ajouté avec succès", record: newRecord });
    } catch (error) {
        console.error("Erreur lors de l'enregistrement des données :", error);
        res.status(500).json({ msg: "Erreur interne du serveur" });
    }
};

// Fonction pour récupérer les enregistrements pour un horaire spécifique
async function getRecordsHour(hour) {
    try {
        const records = await Mesure.findAll({
            where: {
                date: {
                    [Op.between]: [new Date(`2022-01-01T${hour}:00:00`), new Date(`2022-01-01T${hour}:59:59`)]
                }
            }
        });
        return records;
    } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
        return null;
    }
}
async function getRecords() {
    try {
        const recordsFor9AM = await getRecordsHour(9);
        const recordsFor2PM = await getRecordsHour(14);
        const recordsFor5PM = await getRecordsHour(17);

        if (recordsFor9AM && recordsFor2PM && recordsFor5PM) {
            return { recordsFor9AM, recordsFor2PM, recordsFor5PM };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
        return null;
    }
}



  
module.exports = { getWeeklyRecords, storeRecord , getRecords };