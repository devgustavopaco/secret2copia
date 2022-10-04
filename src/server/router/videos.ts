import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createRouter } from './context'

export const videosRouter = createRouter()
    .query('getVideos', {
        resolve({ ctx }) {
            const videos = ctx.prisma.videos.findMany()

            return videos
        },
    })
    .query('getVideoById', {
        input: z.object({
            id: z.string().cuid(),
        }),
        async resolve({ ctx, input }) {
            const video = ctx.prisma.videos.findUnique({
                where: {
                    id: input.id,
                },
            })
            return video
        },
    })
    .middleware(async ({ ctx, next }) => {
        // Any queries or mutations after this middleware will
        // raise an error unless there is a current session
        if (!ctx.session) {
            throw new TRPCError({ code: 'UNAUTHORIZED' })
        }
        return next()
    })
    .mutation('create', {
        input: z.object({
            title: z.string(),
            description: z.string(),
            additionalMaterial: z.string().optional(),
            idYoutube: z.string(),
            createdAt: z.date(),
        }),
        async resolve({ ctx, input }) {
            const videos = await ctx.prisma.videos.create({
                data: {
                    title: input.title,
                    description: input.description,
                    additionalMaterial: input.additionalMaterial,
                    idYoutube: input.idYoutube,
                    createdAt: input.createdAt,
                },
            })
            return videos
        },
    })
    .mutation('delete', {
        input: z.object({
            ids: z.string().cuid().array(),
        }),
        async resolve({ ctx, input }) {
            const video = await ctx.prisma.videos.deleteMany({
                where: {
                    id: {
                        in: input.ids,
                    },
                },
            })

            if (video) {
                return {
                    success: true
                }
            }

            return {
                success: false,
            }
        },
    })
    .mutation('update', {
        input: z.object({
            id: z.string().cuid(),
            title: z.string().optional(),
            description: z.string().optional(),
            additionalMaterial: z.string().optional(),
            idYoutube: z.string().optional(),
        }),
        async resolve({ ctx, input }) {
            const video = await ctx.prisma.videos.update({
                where: {
                    id: input.id,
                },
                data: {
                    title: input.title,
                    description: input.description,
                    additionalMaterial: input.additionalMaterial ? input.additionalMaterial : undefined,
                    idYoutube: input.idYoutube,
                },
            })

            return video
        },
    })
