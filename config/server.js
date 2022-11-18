module.exports = ( { env } ) => ( {
  host: env( 'HOST', '0.0.0.0' ),
  port: env.int( 'PORT', 1337 ),
  admin: {
    auth: {
      secret: env( 'ADMIN_JWT_SECRET', 'af92d5974b48f51f3e4f225395351190' ),
    },
  },
} );
