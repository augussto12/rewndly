import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import { Navigate, createBrowserRouter, RouterProvider, type RouteObject } from 'react-router-dom'
import { RuntimeErrorBoundary } from './RuntimeErrorBoundary'
import { ScrollToTop } from './ScrollToTop'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
// AppErrorPage stays eager: it's the error boundary + 404 fallback and must render instantly.
import { AppErrorPage } from '../pages/AppErrorPage'

// Every page is code-split into its own chunk so the initial load only ships the
// shell + the landing route; the rest streams in on navigation (cached after first visit).
function lazyPage(loader: () => Promise<Record<string, unknown>>, name: string) {
  return lazy(async () => ({ default: (await loader())[name] as ComponentType }))
}

const HomePage = lazyPage(() => import('../pages/HomePage'), 'HomePage')
const ComparePage = lazyPage(() => import('../pages/ComparePage'), 'ComparePage')
const CollectionDetailsPage = lazyPage(() => import('../pages/CollectionDetailsPage'), 'CollectionDetailsPage')
const CompanyDetailsPage = lazyPage(() => import('../pages/CompanyDetailsPage'), 'CompanyDetailsPage')
const LoginPage = lazyPage(() => import('../pages/LoginPage'), 'LoginPage')
const ListDetailsPage = lazyPage(() => import('../pages/ListDetailsPage'), 'ListDetailsPage')
const MePage = lazyPage(() => import('../pages/MePage'), 'MePage')
const MovieDetailsPage = lazyPage(() => import('../pages/MovieDetailsPage'), 'MovieDetailsPage')
const MoviesSearchPage = lazyPage(() => import('../pages/MoviesSearchPage'), 'MoviesSearchPage')
const MyLibraryPage = lazyPage(() => import('../pages/MyLibraryPage'), 'MyLibraryPage')
const MyListsPage = lazyPage(() => import('../pages/MyListsPage'), 'MyListsPage')
const MyReviewsPage = lazyPage(() => import('../pages/MyReviewsPage'), 'MyReviewsPage')
const PeopleSearchPage = lazyPage(() => import('../pages/PeopleSearchPage'), 'PeopleSearchPage')
const PersonDetailsPage = lazyPage(() => import('../pages/PersonDetailsPage'), 'PersonDetailsPage')
const PosterGamePage = lazyPage(() => import('../pages/PosterGamePage'), 'PosterGamePage')
const KeywordDetailsPage = lazyPage(() => import('../pages/KeywordDetailsPage'), 'KeywordDetailsPage')
const FeedPage = lazyPage(() => import('../pages/FeedPage'), 'FeedPage')
const FriendsPage = lazyPage(() => import('../pages/FriendsPage'), 'FriendsPage')
const FriendRequestsPage = lazyPage(() => import('../pages/FriendRequestsPage'), 'FriendRequestsPage')
const DiscoverPage = lazyPage(() => import('../pages/DiscoverPage'), 'DiscoverPage')
const RecommendationsPage = lazyPage(() => import('../pages/RecommendationsPage'), 'RecommendationsPage')
const EpisodeDetailsPage = lazyPage(() => import('../pages/EpisodeDetailsPage'), 'EpisodeDetailsPage')
const PublicListDetailsPage = lazyPage(() => import('../pages/PublicListDetailsPage'), 'PublicListDetailsPage')
const PublicListsPage = lazyPage(() => import('../pages/PublicListsPage'), 'PublicListsPage')
const PublicProfilePage = lazyPage(() => import('../pages/PublicProfilePage'), 'PublicProfilePage')
const PublicReviewsPage = lazyPage(() => import('../pages/PublicReviewsPage'), 'PublicReviewsPage')
const RegisterPage = lazyPage(() => import('../pages/RegisterPage'), 'RegisterPage')
const NetworkDetailsPage = lazyPage(() => import('../pages/NetworkDetailsPage'), 'NetworkDetailsPage')
const SeasonDetailsPage = lazyPage(() => import('../pages/SeasonDetailsPage'), 'SeasonDetailsPage')
const SeriesDetailsPage = lazyPage(() => import('../pages/SeriesDetailsPage'), 'SeriesDetailsPage')
const SeriesSearchPage = lazyPage(() => import('../pages/SeriesSearchPage'), 'SeriesSearchPage')
const SearchPage = lazyPage(() => import('../pages/SearchPage'), 'SearchPage')
const TmdbReviewDetailsPage = lazyPage(() => import('../pages/TmdbReviewDetailsPage'), 'TmdbReviewDetailsPage')
const UserProfilePage = lazyPage(() => import('../pages/UserProfilePage'), 'UserProfilePage')
const AdminActivityEventsPage = lazyPage(() => import('../pages/admin/AdminActivityEventsPage'), 'AdminActivityEventsPage')
const AdminAuditLogsPage = lazyPage(() => import('../pages/admin/AdminAuditLogsPage'), 'AdminAuditLogsPage')
const AdminDashboardPage = lazyPage(() => import('../pages/admin/AdminDashboardPage'), 'AdminDashboardPage')
const AdminListsPage = lazyPage(() => import('../pages/admin/AdminListsPage'), 'AdminListsPage')
const AdminReviewsPage = lazyPage(() => import('../pages/admin/AdminReviewsPage'), 'AdminReviewsPage')
const AdminSystemEventsPage = lazyPage(() => import('../pages/admin/AdminSystemEventsPage'), 'AdminSystemEventsPage')
const AdminUserDetailsPage = lazyPage(() => import('../pages/admin/AdminUserDetailsPage'), 'AdminUserDetailsPage')
const AdminUsersPage = lazyPage(() => import('../pages/admin/AdminUsersPage'), 'AdminUsersPage')

function PageFallback() {
  return (
    <div className="cinema-page grid min-h-svh place-items-center">
      <div className="flex flex-col items-center gap-4">
        <span className="brand-mark animate-pulse" aria-hidden="true">
          <span className="brand-mark-play" />
        </span>
        <span className="text-sm text-[var(--color-text-secondary)]">Cargando…</span>
      </div>
    </div>
  )
}

function withScroll(element: ReactNode) {
  return <ScrollToTop>{element}</ScrollToTop>
}

function withAppError(route: RouteObject): RouteObject {
  return {
    ...route,
    errorElement: route.errorElement ?? withScroll(<AppErrorPage />),
  }
}

const routes: RouteObject[] = [
  {
    path: '/',
    element: withScroll(<HomePage />),
  },
  {
    path: '/login',
    element: withScroll(<LoginPage />),
  },
  {
    path: '/register',
    element: withScroll(<RegisterPage />),
  },
  {
    path: '/search',
    element: withScroll(<SearchPage />),
  },
  {
    path: '/movies/search',
    element: withScroll(<MoviesSearchPage />),
  },
  {
    path: '/movies',
    element: withScroll(<Navigate to="/movies/search" replace />),
  },
  {
    path: '/movies/:tmdbId',
    element: withScroll(<MovieDetailsPage />),
  },
  {
    path: '/series/search',
    element: withScroll(<SeriesSearchPage />),
  },
  {
    path: '/series',
    element: withScroll(<Navigate to="/series/search" replace />),
  },
  {
    path: '/series/:tmdbId',
    element: withScroll(<SeriesDetailsPage />),
  },
  {
    path: '/series/:tmdbId/seasons/:seasonNumber',
    element: withScroll(<SeasonDetailsPage />),
  },
  {
    path: '/series/:tmdbId/seasons/:seasonNumber/episodes/:episodeNumber',
    element: withScroll(<EpisodeDetailsPage />),
  },
  {
    path: '/discover',
    element: withScroll(<DiscoverPage />),
  },
  {
    path: '/recomendados',
    element: withScroll(<RecommendationsPage />),
  },
  {
    path: '/compare',
    element: withScroll(<ComparePage />),
  },
  {
    path: '/games/poster',
    element: withScroll(<PosterGamePage />),
  },
  {
    path: '/people/search',
    element: withScroll(<PeopleSearchPage />),
  },
  {
    path: '/people/:tmdbId',
    element: withScroll(<PersonDetailsPage />),
  },
  {
    path: '/collections/:collectionId',
    element: withScroll(<CollectionDetailsPage />),
  },
  {
    path: '/companies/:companyId',
    element: withScroll(<CompanyDetailsPage />),
  },
  {
    path: '/networks/:networkId',
    element: withScroll(<NetworkDetailsPage />),
  },
  {
    path: '/keywords/:keywordId',
    element: withScroll(<KeywordDetailsPage />),
  },
  {
    path: '/tmdb-reviews/:reviewId',
    element: withScroll(<TmdbReviewDetailsPage />),
  },
  {
    path: '/users/:username',
    element: withScroll(<UserProfilePage />),
  },
  {
    path: '/profiles/:username',
    element: withScroll(<PublicProfilePage />),
  },
  {
    path: '/lists/public',
    element: withScroll(<PublicListsPage />),
  },
  {
    path: '/lists/:id',
    element: withScroll(<PublicListDetailsPage />),
  },
  {
    path: '/reviews/public',
    element: withScroll(<PublicReviewsPage />),
  },
  {
    element: withScroll(<ProtectedRoute />),
    children: [
      {
        path: '/me',
        element: <MePage />,
      },
      {
        path: '/me/library',
        element: <MyLibraryPage />,
      },
      {
        path: '/me/reviews',
        element: <MyReviewsPage />,
      },
      {
        path: '/me/lists',
        element: <MyListsPage />,
      },
      {
        path: '/me/lists/:id',
        element: <ListDetailsPage />,
      },
      {
        path: '/feed',
        element: <FeedPage />,
      },
      {
        path: '/friends',
        element: <FriendsPage />,
      },
      {
        path: '/friends/requests',
        element: <FriendRequestsPage />,
      },
    ],
  },
  {
    element: withScroll(<ProtectedRoute requiredRole="Admin" />),
    children: [
      {
        path: '/admin',
        element: <AdminDashboardPage />,
      },
      {
        path: '/admin/users',
        element: <AdminUsersPage />,
      },
      {
        path: '/admin/users/:id',
        element: <AdminUserDetailsPage />,
      },
      {
        path: '/admin/reviews',
        element: <AdminReviewsPage />,
      },
      {
        path: '/admin/lists',
        element: <AdminListsPage />,
      },
      {
        path: '/admin/system-events',
        element: <AdminSystemEventsPage />,
      },
      {
        path: '/admin/activity-events',
        element: <AdminActivityEventsPage />,
      },
      {
        path: '/admin/audit-logs',
        element: <AdminAuditLogsPage />,
      },
    ],
  },
  {
    path: '*',
    element: withScroll(<AppErrorPage mode="not-found" />),
  },
]

const router = createBrowserRouter(routes.map(withAppError))

export function App() {
  return (
    <RuntimeErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <RouterProvider router={router} />
      </Suspense>
    </RuntimeErrorBoundary>
  )
}
