const Poll = require('../models/Poll.model');

exports.createPoll = async (req, res) => {
  try {
    const { question, options } = req.body;

    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ success: false, message: 'Question and at least 2 options are required' });
    }

    // Format options
    const formattedOptions = options.map(opt => ({
      label: opt,
      votes: 0
    }));

    // Optional: deactivate all other polls when a new one is created to act as "Daily Poll"
    await Poll.updateMany({}, { active: false });

    const newPoll = await Poll.create({
      question,
      options: formattedOptions,
      totalVotes: 0,
      active: true
    });

    res.status(201).json({ success: true, data: newPoll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getActivePoll = async (req, res) => {
  try {
    const poll = await Poll.findOne({ active: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: poll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.votePoll = async (req, res) => {
  try {
    const { optionId } = req.body;
    
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }

    const option = poll.options.id(optionId);
    if (!option) {
      return res.status(400).json({ success: false, message: 'Invalid option' });
    }

    option.votes += 1;
    poll.totalVotes += 1;
    
    await poll.save();

    res.status(200).json({ success: true, data: poll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePoll = async (req, res) => {
  try {
    const poll = await Poll.findByIdAndDelete(req.params.id);
    if (!poll) {
      return res.status(404).json({ success: false, message: 'Poll not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
