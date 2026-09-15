const finuniqueAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authorization header missing"
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Token missing"
        });
    }

    if (token !== process.env.PAYIN_TOKEN) {
        return res.status(403).json({
            message: "Invalid or expired token"
        });
    }

    next();
};

module.exports = finuniqueAuth;