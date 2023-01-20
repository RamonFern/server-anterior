import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "./prisma";



export async function appRoutes(app: FastifyInstance) {
    app.post('/habits', async (request) => {
        const createHabiBody = z.object({
            title: z.string(),
            weekDays: z.array(
                z.number().min(0).max(6)
            )
        })

        const {title, weekDays} = createHabiBody.parse(request.body) 

        // const today = dayjs().startOf('day').toDate()

        await prisma.habit.create({
            data: {
                title,
                created_at: new Date(),
                weekDays: {
                    create: weekDays.map(weekDay => {
                        return {
                            week_day: weekDay,
                        }
                    })
                }
            }
        })
        
    })

    app.get('/day', async (request) => {
        const getDayParams = z.object({
            date: z.coerce.date()
        })

        const { date } = getDayParams.parse(request.query)

        // const weekDay = dayjs(date).get('day')

        //todos habitos possiveis
        //habitos que ja foram completados

        const possibleHabits = await prisma.habit.findMany({
            where: {
                created_at: {
                    lte: date,
                },
                weekDays: {
                    some: {
                        week_day: new Date().getDay(),
                    }
                }
            }
        })

        const day = await prisma.day.findUnique({
            where: {
                date: new Date(), //parsedDate.toDate(),
            },
            include: {
                dayHabits: true,
            }

        })

        const completedHabits = day?.dayHabits.map(dayHabit => {
            return dayHabit.habit_id
        })

        return {
            possibleHabits,
            day,
            completedHabits
        }
        
    })

}


