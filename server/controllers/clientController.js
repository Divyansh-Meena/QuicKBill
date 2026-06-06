const Client = require('../models/Client');

// Get all clients for logged-in user
const getClients = async (req, res) => {
  try {
    const clients = await Client.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new client
const createClient = async (req, res) => {
  try {
    const { name, email, address, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const client = await Client.create({
      userId: req.user.id,
      name,
      email,
      address,
      phone
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update client
const updateClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) return res.status(404).json({ message: 'Client not found' });
    if (client.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedClient = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete client
const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) return res.status(404).json({ message: 'Client not found' });
    if (client.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await client.deleteOne();
    res.json({ message: 'Client deleted', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getClients, createClient, updateClient, deleteClient };