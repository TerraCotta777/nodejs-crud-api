import { IncomingMessage, ServerResponse, createServer } from 'http'
import dotenv from 'dotenv'
import { v4 } from 'uuid'

dotenv.config()
const PORT = process.env.PORT || 4000

type User = {
    id: string
    username: string
    age: number
    hobbies: string[]
}

const users: User[] = [
    {
        id: '05633956-6a02-40ab-8aac-511941a46880',
        username: 'Lancelot',
        age: 32,
        hobbies: ['football', 'painting'],
    },
    {
        id: '0f07b900-466e-4d92-8750-68d380c71dea',
        username: 'Galahad',
        age: 29,
        hobbies: ['swimming', 'filming'],
    },
]

function getJSONDataFromRequestStream<T>(request: IncomingMessage): Promise<T> {
    return new Promise((resolve) => {
        const chunks: Buffer[] = []
        request.on('data', (chunk) => {
            chunks.push(chunk)
        })
        request.on('end', () => {
            resolve(JSON.parse(Buffer.concat(chunks).toString()))
        })
    })
}

const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi
const isValidUUID = (id: string) => regexExp.test(id)

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
        if (req.url === '/api/users') {
            if (req.method === 'GET') {
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.write(JSON.stringify(users))
                res.end()
            } else if (req.method === 'POST') {
                const id = v4()
                const user = await getJSONDataFromRequestStream<Omit<User, 'id'>>(req)
                if ('username' in user && 'age' in user && 'hobbies' in user) {
                    res.writeHead(201, { 'Content-Type': 'application/json' })
                    users.push({ id, ...user })
                    res.end(JSON.stringify(users.find((user) => user.id === id)))
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ title: 'Data is not valid', message: 'Please enter valid data for user' }))
                }
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ title: 'Not Found', message: 'Route not found' }))
            }
        } else if (req.url?.startsWith('/api/users/')) {
            const userId = req.url.split('/')[3]
            if (isValidUUID(userId)) {
                const user = users.find((user) => user.id === userId)
                if (user) {
                    if (req.method === 'GET') {
                        res.writeHead(200, { 'Content-Type': 'application/json' })
                        res.write(JSON.stringify(user))
                    } else if (req.method === 'PUT') {
                        const data = await getJSONDataFromRequestStream<Omit<User, 'id'>>(req)
                        const indexToReplace = users.findIndex((user) => user.id === userId)
                        users[indexToReplace] = { ...user, ...data }
                        res.writeHead(200, { 'Content-Type': 'application/json' })
                        res.end(JSON.stringify(users[indexToReplace]))
                    } else if (req.method === 'DELETE') {
                        const indexToReplace = users.findIndex((user) => user.id === userId)
                        users.splice(indexToReplace, 1)
                        res.writeHead(204, { 'Content-Type': 'application/json' })
                        res.write(JSON.stringify(users))
                        res.end()
                    }
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' })
                    res.write(JSON.stringify({ title: 'Not Found', message: `User with id: ${userId} does not exist` }))
                }
            } else {
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.write(
                    JSON.stringify({
                        title: 'Id is not valid',
                        message: `Provided user id: ${userId} is not valid uuid`,
                    }),
                )
            }
            res.end()
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.write(JSON.stringify({ title: 'Not Found', message: 'Route not found' }))
            res.end()
        }
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.write(JSON.stringify({ title: 'Internal Server Error', message: 'An error occurred on the server' }))
        res.end()
    }
})

server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})
