import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context) {
	const posts = await getCollection('posts');
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.filter(p => p.data.published).map((post) => ({
			title: post.title,
			description: post.description,
			pubDate: post.data.pubDate?.toISOString(),
			link: `/posts/${post.slug}/`,
		})),
	});
}
