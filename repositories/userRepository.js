import fs from 'fs-extra'

const filePath = './data/users.json'

async function getUsers() {
    try {
        return await fs.readJson(filePath)
    } catch (error) {
        return []
    }
}

async function saveUsers(users) {
    await fs.writeJson(filePath, users)
}

export default {
    getUsers,
    saveUsers
} 