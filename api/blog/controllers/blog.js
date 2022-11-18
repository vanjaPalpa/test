'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async findElementsBlogs( ctx ) {
        let entities;

        const result = await strapi
            .query( 'blog' )
            .model.query( qb => {
                qb.where( 'page', 'LIKE', "%elements%" );
            } )
            .fetchAll();

        entities = result;

        return entities;
    },
    async findByPage( ctx ) {
        const { type } = ctx.params;
        const { page } = ctx.query;
        const { perPage } = ctx.query;
        const { category } = ctx.query;
        let filteredCategory;
        let count = 0;
        let totalCount = 0;
        let result;

        if ( category ) {
            let filteredEntity = await strapi
                .query( 'blog-categories' )
                .model.query( qb => {
                    qb.where( 'slug', category );
                } )
                .fetch();
            filteredEntity = filteredEntity.toJSON();
            result = filteredEntity.blogs.filter( blog => {
                return blog.page !== null && blog.page.includes( type );
            } )
        } else {
            result = await strapi
                .query( 'blog' )
                .model.query( qb => {
                    qb.where( 'page', 'LIKE', '%' + type + '%' );
                } )
                .fetchAll();
        }

        let categoryEntities = await strapi
            .query( 'blog-categories' )
            .model.query( qb => {
                qb.select( 'name', 'slug' );
            } )
            .fetchAll();

        categoryEntities = categoryEntities.toJSON();

        for ( let i = 0; i < categoryEntities.length; i++ ) {
            filteredCategory = await strapi
                .query( 'blog-categories' )
                .model.query( qb => {
                    qb.where( 'slug', categoryEntities[ i ].slug );
                } )
                .fetch();
            filteredCategory = filteredCategory.toJSON();
            for ( let j = 0; j < filteredCategory.blogs.length; j++ ) {
                if ( filteredCategory.blogs[ j ].page !== null ) {
                    if ( filteredCategory.blogs[ j ].page.includes( type ) ) {
                        count++;
                    }
                }
            }

            categoryEntities[ i ].count = count;
            count = 0;
        }

        totalCount = await strapi
            .query( 'blog' )
            .model.query( qb => {
                qb.where( 'page', 'LIKE', '%' + type + '%' );
            } )
            .count();


        return { 'blogs': result.slice( ( page - 1 ) * perPage, page * perPage ), 'totalCount': totalCount, 'categories': categoryEntities };
    },
    async findBySlug( ctx ) {
        const { slug } = ctx.params;
        const { demo } = ctx.query;
        let filteredCategory;
        let count = 0;
        let categories, filteredBlogIds = [];

        const entity = await strapi.query( 'blog' )
            .model.query( qb => {
                qb.where( "slug", slug );
            } )
            .fetch();

        const category = entity.toJSON().blog_categories;

        for ( let i = 0; i < category.length; i++ ) {
            categories = await strapi.query( 'blog-categories' )
                .model.query( qb => {
                    qb.where( 'name', category[ i ].name );
                } )
                .fetch();
            let ids = categories.toJSON().blogs.reduce( ( acc, cur ) => {
                return [ ...acc, cur.id ];
            }, [] );

            filteredBlogIds = [ ...filteredBlogIds, ...ids ];
        }

        filteredBlogIds = filteredBlogIds.reduce( ( acc, cur ) => {
            if ( acc.includes( cur ) ) return acc;
            return [ ...acc, cur ]
        }, [] );

        filteredBlogIds = filteredBlogIds.sort( function ( a, b ) {
            return a - b;
        } )

        const relatedEntities = await strapi.query( 'blog' )
            .model.query( qb => {
                qb.where( 'id', 'IN', filteredBlogIds );
            } )
            .fetchAll();

        let relatedBlogs = relatedEntities.toJSON();
        relatedBlogs = relatedBlogs.filter( blog => {
            return blog.demo !== null && ( blog.demo.includes( 'elements' ) || blog.demo.includes( demo ) );
        } )

        var curIndex = -1;
        var prevBlog = null;
        var nextBlog = null;
        relatedBlogs.map( ( item, index ) => {
            if ( item[ 'id' ] == entity.id ) curIndex = index;
        } );
        if ( curIndex >= 1 )
            prevBlog = relatedBlogs[ curIndex - 1 ];
        else prevBlog = null;

        if ( curIndex < relatedBlogs.length - 1 )
            nextBlog = relatedBlogs[ curIndex + 1 ];
        else nextBlog = null;

        relatedBlogs = relatedBlogs.filter( blog => {
            return blog.id !== entity.id;
        } )

        let categoryEntities = await strapi
            .query( 'blog-categories' )
            .model.query( qb => {
                qb.select( 'name', 'slug' );
            } )
            .fetchAll();

        categoryEntities = categoryEntities.toJSON();

        for ( let i = 0; i < categoryEntities.length; i++ ) {
            filteredCategory = await strapi
                .query( 'blog-categories' )
                .model.query( qb => {
                    qb.where( 'slug', categoryEntities[ i ].slug );
                } )
                .fetch();
            filteredCategory = filteredCategory.toJSON();
            for ( let j = 0; j < filteredCategory.blogs.length; j++ ) {
                if ( filteredCategory.blogs[ j ].page !== null ) {
                    if ( filteredCategory.blogs[ j ].page.includes( 'classic' ) ) {
                        count++;
                    }
                }
            }

            categoryEntities[ i ].count = count;
            count = 0;
        }

        return { 'blog': entity, 'relatedBlogs': relatedBlogs.slice( 0, 4 ), 'prevBlog': prevBlog, 'nextBlog': nextBlog, categories: categoryEntities };
    }
};
