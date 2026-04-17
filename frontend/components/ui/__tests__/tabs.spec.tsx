/**
 * Tabs Component Tests
 */

import { render } from '@testing-library/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs'

describe('Tabs', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(
        <Tabs defaultValue="tab-1">
          <TabsList>
            <TabsTrigger value="tab-1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab-2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab-1">Content 1</TabsContent>
          <TabsContent value="tab-2">Content 2</TabsContent>
        </Tabs>
      )
    ).not.toThrow()
  })

  it('renders all tabs', () => {
    const { getByText } = render(
      <Tabs defaultValue="tab-1">
        <TabsList>
          <TabsTrigger value="tab-1">First Tab</TabsTrigger>
          <TabsTrigger value="tab-2">Second Tab</TabsTrigger>
        </TabsList>
        <TabsContent value="tab-1">First Content</TabsContent>
        <TabsContent value="tab-2">Second Content</TabsContent>
      </Tabs>
    )

    expect(getByText('First Tab')).toBeInTheDocument()
    expect(getByText('Second Tab')).toBeInTheDocument()
    expect(getByText('First Content')).toBeInTheDocument()
  })
})
