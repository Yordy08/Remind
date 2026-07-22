<template>
  <div class="app-layout">

    <Navbar />

    <main class="content">
      <slot />
    </main>

    <Footer />

    <ReviewPrompt />
    <DailyPhrasePrompt />

  </div>
</template>
