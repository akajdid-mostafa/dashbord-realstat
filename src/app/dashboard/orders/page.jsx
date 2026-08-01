"use client";
import React, { useContext } from 'react';
import { Button, Stack } from '@mui/material';
import { DataContext } from '@/contexts/post';
import { CompaniesFilters } from '@/components/dashboard/integrations/integrations-filters';

 const Page=React.memo( function Page() {
  const { fetchOrders } = useContext(DataContext);

  const handleRefresh = async () => {
    await fetchOrders(); // Call fetchData to refresh data
  };

  return (
    <Stack spacing={3}>
      <Button
        variant="contained"
        onClick={handleRefresh}
        style={{ width: '100px' }}
      >Refresh
      </Button>
      <CompaniesFilters />
    </Stack>
  );
})

export default Page
