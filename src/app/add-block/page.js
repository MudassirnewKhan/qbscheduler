const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  if (!startTime || !endTime) {
    setError("Both start and end times are required.");
    setLoading(false);
    return;
  }

  const toUTCISOString = (localDateTimeStr) => new Date(localDateTimeStr).toISOString();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    setError("You must be logged in to create a block.");
    setLoading(false);
    return;
  }

  try {
    const res = await fetch('/api/create-block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        startTime: toUTCISOString(startTime),
        endTime: toUTCISOString(endTime),
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      setError(result.error || 'Failed to create block');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  } catch (err) {
    setError('Something went wrong: ' + err.message);
  } finally {
    setLoading(false);
  }
};
