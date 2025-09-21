import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Blocks, Brain, Users, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-6 lg:px-8 pt-20 pb-16 sm:pt-32 sm:pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Build AI-Powered Study Workflows
              <span className="block text-primary">Without Writing Code</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Synapse empowers learners to create personalized study tools through visual workflows. 
              Drag, drop, and connect AI-powered blocks to build your perfect learning experience.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/canvas">
                <Button size="lg" className="gap-2">
                  Start Building <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="outline" size="lg">
                  Explore Workflows
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Everything you need to learn smarter
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Combine powerful AI blocks to create study workflows tailored to your learning style
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-7xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <Feature
                icon={<Blocks className="h-6 w-6" />}
                title="Modular Blocks"
                description="Pre-built AI blocks for summarization, Q&A, flashcards, and more"
              />
              <Feature
                icon={<Brain className="h-6 w-6" />}
                title="AI-Powered"
                description="Leverage GPT-4, Claude, and other models to enhance your learning"
              />
              <Feature
                icon={<Zap className="h-6 w-6" />}
                title="No-Code Builder"
                description="Visual canvas interface - no programming skills required"
              />
              <Feature
                icon={<Users className="h-6 w-6" />}
                title="Community Hub"
                description="Share workflows and discover what works for others"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative isolate py-16 px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Ready to transform your learning?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600 dark:text-gray-300">
            Join thousands of learners building custom study workflows with Synapse.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/signup">
              <Button size="lg">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="relative">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        {icon}
      </div>
      <h3 className="mt-6 text-lg font-semibold leading-8 text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-300">
        {description}
      </p>
    </div>
  )
}