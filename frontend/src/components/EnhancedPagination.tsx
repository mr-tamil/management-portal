'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { createPaginationInfo } from '@/utils/performance'

interface EnhancedPaginationProps {
  currentPage: number
  totalPages: number
  total: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export function EnhancedPagination({
  currentPage,
  totalPages,
  total,
  itemsPerPage,
  onPageChange,
  isLoading = false
}: EnhancedPaginationProps) {
  if (totalPages <= 1) return null

  const pages = createPaginationInfo(currentPage, totalPages)
  const startItem = ((currentPage - 1) * itemsPerPage) + 1
  const endItem = Math.min(currentPage * itemsPerPage, total)

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {startItem} to {endItem} of {total} items
          </div>
          
          <div className="flex items-center space-x-1">
            {/* First page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1 || isLoading}
              className="hidden sm:flex"
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            
            {/* Previous page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || isLoading}
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {pages.map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-2 py-1 text-muted-foreground">...</span>
                  ) : (
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(page as number)}
                      disabled={isLoading}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  )}
                </React.Fragment>
              ))}
            </div>
            
            {/* Next page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || isLoading}
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {/* Last page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages || isLoading}
              className="hidden sm:flex"
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
