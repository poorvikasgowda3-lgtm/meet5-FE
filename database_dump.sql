-- Supabase PostgreSQL schema for Meet5

create table users (
  user_id serial primary key,
  username text not null unique,
  display_name text not null,
  avatar_url text
);

create table articles (
  article_id serial primary key,
  author_id int not null references users(user_id) on delete cascade,
  title text not null,
  summary text,
  content text not null,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table interactions (
  interaction_id serial primary key,
  article_id int not null references articles(article_id) on delete cascade,
  user_id int not null references users(user_id) on delete cascade,
  type text not null,
  duration_seconds int not null default 0,
  device_type text,
  created_at timestamptz not null default now()
);

-- Sample data for demo
insert into users (username, display_name, avatar_url)
values
  ('sarah_writer', 'Sarah Chen', null),
  ('john_dev', 'John Developer', null),
  ('emma_design', 'Emma Designer', null),
  ('alex_tech', 'Alex Thompson', null),
  ('mike_creator', 'Mike Creator', null),
  ('appi20209', 'Appi', null);

insert into articles (author_id, title, summary, content, status, published_at)
values
  (1, 'The Future of Remote Work', 'How working from home is reshaping industries forever.', 'Remote work has fundamentally changed how we think about productivity and collaboration. Companies are discovering that distributed teams can be more efficient than traditional office setups. The flexibility allows employees to optimize their environment and work during their most productive hours. This shift has opened opportunities for global talent acquisition and reduced overhead costs for businesses. However, it requires new communication strategies and tools to maintain team cohesion and company culture.', 'published', now() - interval '5 days'),
  (2, 'Building Your First Web App', 'A beginner''s guide to creating a modern web application.', 'Starting your first web development project can feel overwhelming. This guide breaks down the essential steps: choose your tech stack, set up your development environment, plan your project structure, and start coding. Modern frameworks like React and Next.js make it easier than ever to build professional applications. Don''t get caught up in analysis paralysis - the best way to learn is by building. Start small, iterate quickly, and gradually add more features as you gain confidence.', 'published', now() - interval '3 days'),
  (3, 'Designing for Accessibility', 'Why inclusive design benefits everyone.', 'Accessible design is not just about helping people with disabilities - it benefits everyone. When you design for accessibility, you create better user experiences overall. Clear typography, good color contrast, and intuitive navigation help all users navigate your product more easily. Keyboard navigation, screen reader compatibility, and alt text for images are standard practices that should be part of every design. Companies that prioritize accessibility often find their products have better engagement across all user demographics.', 'published', now() - interval '7 days'),
  (4, 'AI and the Future of Work', 'How artificial intelligence is transforming industries.', 'Artificial intelligence is no longer science fiction - it''s reshaping how we work today. From automation of routine tasks to AI-powered analytics, organizations are leveraging these technologies to increase productivity and make better decisions. However, the rise of AI also brings challenges around job displacement and the need for new skills. The future likely involves humans and AI working together, with AI handling data-heavy tasks and humans focusing on creativity and strategy. To stay relevant, professionals need to embrace continuous learning and understand how to work effectively with AI tools.', 'published', now() - interval '4 days'),
  (5, 'The Art of Digital Storytelling', 'Using multimedia to create engaging narratives.', 'Digital storytelling combines text, images, audio, and video to create compelling narratives. In today''s fast-paced digital world, audiences respond better to well-crafted stories than to pure information dumps. Successful digital storytelling requires understanding your audience and choosing the right medium for your message. Whether you''re creating blog posts, videos, or interactive experiences, the principles remain the same: start with a strong story, use visuals effectively, and make an emotional connection with your audience. The tools available today make it easier than ever to create professional-quality digital content.', 'published', now() - interval '2 days'),
  (6, 'Sustainable Tech: Building for Tomorrow', 'How technology companies can reduce their environmental impact.', 'As technology becomes increasingly central to our lives, companies have a responsibility to consider environmental impact. From data center energy consumption to hardware manufacturing, every part of the tech industry has an environmental footprint. Sustainable practices include optimizing code efficiency, using renewable energy, implementing circular economy principles, and designing for longevity. The tech industry is starting to recognize that sustainability is not just good for the planet - it''s also good for business. Companies leading in sustainability innovation are attracting talent and customers who care about the future.', 'published', now() - interval '6 days'),
  (7, 'Mental Health in the Tech Industry', 'Breaking the stigma and promoting wellbeing.', 'The tech industry is known for long hours and high pressure, often at the cost of employee mental health. Burnout is common, but it doesn''t have to be inevitable. Forward-thinking companies are implementing mental health initiatives, flexible work arrangements, and wellness programs. Individuals can also take responsibility for their wellbeing by setting boundaries, practicing mindfulness, and seeking support when needed. The conversation around mental health in tech is changing - talking about struggles is becoming more normalized, and more people are prioritizing their mental health alongside their careers.', 'published', now() - interval '8 days');

