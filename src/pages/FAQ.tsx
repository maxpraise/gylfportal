import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import {
  HelpCircle,
  Search,
  MessageCircle,
  Mail,
  BookOpen,
  Users,
  Heart,
  Award,
  Globe,
} from 'lucide-react';

const faqCategories = [
  {
    id: 'general',
    title: 'General',
    icon: Globe,
    questions: [
      {
        q: 'What is GYLF?',
        a: 'GYLF (Global Youth Leaders Forum) is a global platform dedicated to raising young leaders and building the future. We equip youth with leadership skills, values, and a network to make a positive impact in their communities.',
      },
      {
        q: 'How do I become a GYLF Ambassador?',
        a: 'To become a GYLF Ambassador, simply sign up on our platform using a valid referral code. Once registered, you automatically become an Ambassador and can start inviting others to join the movement.',
      },
      {
        q: 'Is there a cost to join GYLF?',
        a: 'No, joining GYLF is completely free. We believe in making leadership development accessible to all young people.',
      },
    ],
  },
  {
    id: 'referrals',
    title: 'Referrals & Growth',
    icon: Users,
    questions: [
      {
        q: 'How does the referral system work?',
        a: 'Each member receives a unique referral code upon registration. When you share this code with others and they sign up using it, they become part of your network. Your referral count helps you progress through different leadership levels.',
      },
      {
        q: 'How do I find my referral code?',
        a: 'Your referral code can be found on your Dashboard, in the Invite Members page, and in the GYLF Connect section. You can copy and share it directly from any of these locations.',
      },
      {
        q: 'What are the different leadership levels?',
        a: 'GYLF has a progressive leadership path: Member → Ambassador → Chapter Representative → Regional Leader. You advance by growing your network through referrals and active participation.',
      },
    ],
  },
  {
    id: 'heart',
    title: 'HEART Initiative',
    icon: Heart,
    questions: [
      {
        q: 'What is the HEART Initiative?',
        a: 'HEART stands for Humanitarian, Evangelism, Arts, Representation, and Technology. It\'s our comprehensive outreach framework that allows members to make an impact in various areas of society.',
      },
      {
        q: 'How do I submit a HEART report?',
        a: 'Go to the HEART Initiative page, select the appropriate category for your outreach, fill in the details including location, impact metrics, and upload any supporting images. Submit the form and your report will be reviewed.',
      },
      {
        q: 'What information should I include in my report?',
        a: 'Include the outreach name, date, location, number of people reached, souls won (if applicable), youths incorporated, any testimonies, and photos from the event.',
      },
    ],
  },
  {
    id: 'academy',
    title: 'GYLF Academy',
    icon: Award,
    questions: [
      {
        q: 'What is GYLF Academy?',
        a: 'GYLF Academy is our training platform where members can access leadership courses, watch training videos, take quizzes, and earn certificates to enhance their leadership capabilities.',
      },
      {
        q: 'How do I access training materials?',
        a: 'Navigate to the GYLF Academy page from the sidebar. There you\'ll find available courses organized by category. Click on any course to start learning.',
      },
      {
        q: 'How does the partnership giving work?',
        a: 'You can support GYLF through monthly partnerships, project support, or one-time offerings. Multiple payment methods are available including Espees, credit cards, and bank transfers.',
      },
    ],
  },
  {
    id: 'meetings',
    title: 'GYLF Connect',
    icon: BookOpen,
    questions: [
      {
        q: 'What is GYLF Connect?',
        a: 'GYLF Connect refers to our regular meetings where members gather (online or physically) for fellowship, training, and planning. These meetings are essential for community building and growth.',
      },
      {
        q: 'How do I report a meeting?',
        a: 'Go to the GYLF Meetings page, click "Report Meeting", and fill in the details including meeting title, date, type (online/physical/hybrid), attendance numbers, and any offering collected.',
      },
      {
        q: 'Where can I find meeting resources?',
        a: 'The GYLF Connect page contains meeting outlines, training videos, publicity materials, and other resources to help you organize successful meetings.',
      },
    ],
  },
];

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = faqCategories.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (q) =>
        q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.a.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((category) => category.questions.length > 0);

  const displayCategories = selectedCategory
    ? filteredCategories.filter((c) => c.id === selectedCategory)
    : filteredCategories;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Help & FAQ</h1>
        <p className="text-muted-foreground mt-1">
          Find answers to common questions about GYLF
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for answers..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          All Topics
        </Button>
        {faqCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
            >
              <Icon className="mr-1 h-4 w-4" />
              {category.title}
            </Button>
          );
        })}
      </div>

      {/* FAQ Sections */}
      {displayCategories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No Results Found</h3>
            <p className="text-muted-foreground">Try adjusting your search or browse all topics</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {displayCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((item, index) => (
                      <AccordionItem key={index} value={`${category.id}-${index}`}>
                        <AccordionTrigger className="text-left">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Contact Support */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Still Need Help?
          </CardTitle>
          <CardDescription>
            Can't find what you're looking for? Reach out to our support team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1">
              <Mail className="mr-2 h-4 w-4" />
              Email Support
            </Button>
            <Button className="flex-1">
              <MessageCircle className="mr-2 h-4 w-4" />
              Live Chat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FAQ;
