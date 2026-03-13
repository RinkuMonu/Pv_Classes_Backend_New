const Contact = require("../Models/Contact");

// 📌 Create a new contact message
exports.createContact = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, message } = req.body;

        if (!firstName || !lastName || !email || !phone || !message) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newContact = new Contact({
            firstName,
            lastName,
            email,
            phone,
            message
        });

        await newContact.save();

        res.status(201).json({
            message: "Message received successfully",
            contact: newContact
        });
    } catch (err) {
        console.error("Error saving contact:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// 📌 Fetch contacts with pagination & search
exports.getContacts = async (req, res) => {
  try {
    let { page = 1, limit = 5, search = "" } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    // Search by firstName, lastName, email, phone
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    const totalContacts = await Contact.countDocuments(query);

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      data: contacts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalContacts / limit),
        totalContacts,
        limit
      }
    });

  } catch (err) {
    console.error("Error fetching contacts:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 📌 Fetch a single contact message by ID
exports.getContactById = async (req, res) => {
    try {
        const { id } = req.params;
        const contact = await Contact.findById(id);
        if (!contact) {
            return res.status(404).json({ message: "Contact not found" });
        }
        res.status(200).json(contact);
    } catch (err) {
        console.error("Error fetching contact:", err);
        res.status(500).json({ message: "Server error" });
    }
};
