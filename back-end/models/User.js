const db = require("../config/db");

const User = {
  findByUsername: async (username) => {
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE username = ? LIMIT 1",
      [username]
    );
    return rows[0];
  },

  findById: async (id) => {
    const [rows] = await db.execute(
      "SELECT id, username, role FROM users WHERE id = ?",
      [id]
    );
    return rows[0];
  }
};

module.exports = User;
