# Production Deployment Checklist

## Pre-Deployment Checklist

### Security
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` to your Supabase project URL
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your Supabase anon key
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` to your Supabase service role key (for admin APIs)
- [ ] Set `NEXT_PUBLIC_SETTINGS_PASSWORD` to a secure password for settings panel
- [ ] Set `GITHUB_PAT` with workflow dispatch permissions for backup system
- [ ] Set `NEXT_PUBLIC_SITE_URL` to your production domain
- [ ] Enable Row Level Security (RLS) on all Supabase tables
- [ ] Configure proper CORS settings in Supabase

### Database
- [ ] Run all pending migrations
- [ ] Verify database indexes are created
- [ ] Test RPC functions work correctly
- [ ] Set up database connection pooling if needed
- [ ] Configure database backup schedule

### Application
- [ ] Run `npm run build` successfully
- [ ] Run `npm run type-check` with no errors
- [ ] Run `npm test` with >80% coverage
- [ ] Verify all environment variables are set
- [ ] Test authentication flow (if applicable)
- [ ] Test all CRUD operations
- [ ] Verify file upload/download works
- [ ] Test email sending functionality

### Monitoring
- [ ] Set up error tracking (Sentry recommended)
- [ ] Configure logging aggregation
- [ ] Set up health check monitoring
- [ ] Configure alerts for errors
- [ ] Set up performance monitoring

### Backup & Recovery
- [ ] Verify GitHub Actions backup workflow is enabled
- [ ] Test manual backup trigger
- [ ] Document recovery procedures
- [ ] Set up backup retention policy

### Performance
- [ ] Run Lighthouse audit (>90 performance score)
- [ ] Test with real network throttling
- [ ] Verify API response times <200ms
- [ ] Check bundle size <200KB gzipped
- [ ] Verify images are optimized

## Post-Deployment Checklist

- [ ] Verify homepage loads correctly
- [ ] Test user authentication flow
- [ ] Test all CRUD operations
- [ ] Verify file uploads work
- [ ] Test search functionality
- [ ] Verify export features work
- [ ] Check error tracking for new errors
- [ ] Monitor performance metrics
- [ ] Test backup system
- [ ] Verify notifications work

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (for admin APIs) | Supabase service role key |
| `NEXT_PUBLIC_SETTINGS_PASSWORD` | No (default: "1234") | Password for settings panel |
| `GITHUB_PAT` | No | GitHub PAT for backup workflow |
| `NEXT_PUBLIC_SITE_URL` | No | Production site URL |

## Security Headers

The application includes security headers via middleware:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection
- Referrer-Policy
- Content-Security-Policy

## Rate Limiting

API routes include rate limiting:
- Storage stats: 100 requests/minute (production)
- Backup trigger: 100 requests/minute (production)
- Health check: Unlimited

## Health Check

Endpoint: `GET /api/health`

Returns:
- `200 OK` when healthy
- `503 Service Unavailable` when degraded

## Troubleshooting

### Common Issues

1. **Build fails**: Check TypeScript errors with `npm run type-check`
2. **API errors**: Check environment variables are set correctly
3. **Auth issues**: Verify Supabase RLS policies
4. **Slow performance**: Check database indexes and query performance

## Support

For issues, check:
1. Application logs in Vercel dashboard
2. Supabase dashboard for database issues
3. GitHub Actions logs for backup failures
