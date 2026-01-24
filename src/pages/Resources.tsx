import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Video,
  FileText,
  Download,
  ExternalLink,
  Clock,
  Star,
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'article';
  duration?: string;
  featured?: boolean;
}

const resources: Resource[] = [
  {
    id: '1',
    title: 'Introduction to GYLF Leadership',
    description: 'Learn about the core principles and values of the Global Youth Leaders Forum.',
    type: 'video',
    duration: '15 min',
    featured: true,
  },
  {
    id: '2',
    title: 'Building Your Network',
    description: 'Strategies for effectively growing your network of young leaders.',
    type: 'document',
    featured: true,
  },
  {
    id: '3',
    title: 'Leadership Fundamentals',
    description: 'Essential leadership skills every ambassador should develop.',
    type: 'article',
  },
  {
    id: '4',
    title: 'Community Engagement Guide',
    description: 'How to make a positive impact in your local community.',
    type: 'document',
  },
  {
    id: '5',
    title: 'Public Speaking Workshop',
    description: 'Master the art of public speaking and influence.',
    type: 'video',
    duration: '45 min',
  },
  {
    id: '6',
    title: 'Referral Success Stories',
    description: 'Learn from ambassadors who have built thriving networks.',
    type: 'article',
  },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'video':
      return Video;
    case 'document':
      return FileText;
    default:
      return BookOpen;
  }
};

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'video':
      return 'Video';
    case 'document':
      return 'Document';
    default:
      return 'Article';
  }
};

const Resources = () => {
  const featuredResources = resources.filter((r) => r.featured);
  const allResources = resources.filter((r) => !r.featured);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Resource Center</h1>
        <p className="text-muted-foreground mt-1">
          Access training materials, guides, and resources to help you grow
        </p>
      </div>

      {/* Featured Resources */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-chart-2" />
          Featured Resources
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {featuredResources.map((resource) => {
            const Icon = getTypeIcon(resource.type);
            return (
              <Card key={resource.id} className="border-border hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="secondary">{getTypeBadge(resource.type)}</Badge>
                  </div>
                  <CardTitle className="text-lg mt-3">{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    {resource.duration && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {resource.duration}
                      </span>
                    )}
                    <Button variant="outline" size="sm">
                      {resource.type === 'document' ? (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </>
                      ) : (
                        <>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* All Resources */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          All Resources
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allResources.map((resource) => {
            const Icon = getTypeIcon(resource.type);
            return (
              <Card key={resource.id} className="border-border hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-lg">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getTypeBadge(resource.type)}
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-2">{resource.title}</CardTitle>
                  <CardDescription className="text-sm line-clamp-2">
                    {resource.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    {resource.type === 'document' ? (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </>
                    ) : (
                      <>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Coming Soon */}
      <Card className="border-border border-dashed">
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">More Resources Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We&apos;re constantly adding new training materials, workshops, and guides to help you on your leadership journey.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Resources;
