const User = require('../models/User.model');

const sedTokenResponse = (user, statusCode, res) =>{
    const token = user.getSignedJwtToken();
    res.status(statusCode).json({
        success: true,
        token,
        user:{
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
         
        }
    })
}

exports.register = async (req, res, next) => {
    try {
        const { name, email, password,  } = req.body;
        const user = await User.create({
            name,
            email,
            password,
       
        })
        
        sedTokenResponse(user, 201, res);
        }catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            })
       
    }
}

exports.login = async (req, res)=>{
    try {
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            })
        }
        const user = await User.findOne({email}).select('+password');
        if(!user){
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            })
        }
        if(!(await user.matchPassword(password))){
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            })
        }
        if(!user.isActive){
            return res.status(403).json({
                success: false,
                message: 'Your account is deactivated. Please contact support.'
            }) 
        }   
        sedTokenResponse(user, 200, res);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.getMe = async (req, res)=>{
    res.status(200).json({
        success: true,
        user: req.user
    })
}

exports.saveFMCToken = async (req, res) => {
    try {
        const {token}   = req.body;
        const user = await User.findById(req.user.id);
        if(!user.fmcToken.includes(token)){
            user.fmcToken.push(token);
            await user.save();
        }
        res.status(200).json({
            success: true,
            message: 'FMC token saved successfully and Notifications enabled'
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })

    }
}
