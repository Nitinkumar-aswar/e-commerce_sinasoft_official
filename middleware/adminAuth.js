// middleware/adminAuth.js
module.exports = function (req, res, next) {
  if (!req.session || !req.session.admin) {
    return res.redirect("/admin"); // redirect to login if not logged in
  }
  next();
};
