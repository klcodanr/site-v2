import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
	type: 'content',
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		pubDate: z.coerce.date().optional(),
		image: z.string().optional(),
		published: z.boolean(),
		display: z.string().optional(),
		tags: z.array(z.string()),
	}),
});

const jobs = defineCollection({
	type: 'content',
	// Type-check frontmatter using a schema
	schema: z.object({
		company: z.string(),
		end: z.string(),
		location: z.string(),
		role: z.string(),
		start: z.string(),
		tasks: z.array(z.string()),
	}),
});

const projects = defineCollection({
	type: 'content',
	// Type-check frontmatter using a schema
	schema: z.object({
		clientName: z.string(),
		endDate: z.coerce.date(),
		projectName: z.string(),
		projectRole: z.string(),
		startDate: z.coerce.date(),
		image: z.string(),
		tasks: z.array(z.string()),
		tools: z.array(z.string()),
		title: z.string(),
		description: z.string().optional(),
		hideInNav: z.boolean(),
		tags: z.array(z.string()),
	}),
});

export const collections = { jobs, posts, projects };
