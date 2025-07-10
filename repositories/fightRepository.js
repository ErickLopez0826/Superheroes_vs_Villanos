import fs from 'fs-extra'

const filePath = './data/fights.json'

async function getFights() {
    try {
        return await fs.readJson(filePath)
    } catch (error) {
        return []
    }
}

async function saveFights(fights) {
    await fs.writeJson(filePath, fights, { spaces: 2 })
}

export default {
    getFights,
    saveFights
} 