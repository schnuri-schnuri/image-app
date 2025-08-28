"use client";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      <h1 className="text-3xl font-bold mb-4 text-center sm:text-left">Image App</h1>
      <label className="block">
        <span className="sr-only">Choose image to upload</span>
        <input
          type="file"
          accept="image/*"
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              alert(`Selected image: ${file.name}`);
            }
          }}
        />
      </label>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://www.juriw.com/imprint"
          target="_blank"
          rel="noopener noreferrer"
        >
          Imprint
        </a>
      </footer>
    </div>
  );
}
