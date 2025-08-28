import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../page';

// Mock fetch API
global.fetch = vi.fn();

function createFetchResponse(data, ok = true) {
  return {
    ok,
    json: () => Promise.resolve(data),
  };
}

describe('Home Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the title and file input', () => {
    render(<Home />);
    
    expect(screen.getByText('The Next Image Flipper')).toBeInTheDocument();
    expect(screen.getByLabelText(/choose image to upload/i)).toBeInTheDocument();
  });

  it('should display upload button after selecting an image', async () => {
    render(<Home />);
    
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/choose image to upload/i);
    
    // Act
    await userEvent.upload(input, file);
    
    // Assert
    expect(screen.getByRole('button', { name: /upload image/i })).toBeInTheDocument();
  });

  it('should show success message after successful upload', async () => {
    // Mock successful fetch
    global.fetch = vi.fn().mockResolvedValueOnce(
      createFetchResponse({ message: 'Received image.' })
    );
    
    render(<Home />);
    
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/choose image to upload/i);
    
    // Act
    await userEvent.upload(input, file);
    fireEvent.click(screen.getByRole('button', { name: /upload image/i }));
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText(/upload successful/i)).toBeInTheDocument();
    });
    
    expect(global.fetch).toHaveBeenCalledWith('/api/images', {
      method: 'POST',
      body: file,
      headers: {
        'Content-Type': 'image/png',
      },
    });
  });

  it('should show error message if upload fails', async () => {
    // Mock failed fetch
    global.fetch = vi.fn().mockResolvedValueOnce(
      createFetchResponse({ error: 'Not an image' }, false)
    );
    
    render(<Home />);
    
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/choose image to upload/i);
    
    // Act
    await userEvent.upload(input, file);
    fireEvent.click(screen.getByRole('button', { name: /upload image/i }));
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText(/not an image/i)).toBeInTheDocument();
    });
  });

  it('should show generic error message if fetch throws', async () => {
    // Mock fetch error
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
    
    render(<Home />);
    
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/choose image to upload/i);
    
    // Act
    await userEvent.upload(input, file);
    fireEvent.click(screen.getByRole('button', { name: /upload image/i }));
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText(/error uploading image/i)).toBeInTheDocument();
    });
  });

  it('should disable upload button while uploading', async () => {
    // Mock slow fetch to test loading state
    global.fetch = vi.fn().mockImplementationOnce(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(createFetchResponse({ message: 'Received image.' }));
        }, 100);
      });
    });
    
    render(<Home />);
    
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/choose image to upload/i);
    
    // Act
    await userEvent.upload(input, file);
    fireEvent.click(screen.getByRole('button', { name: /upload image/i }));
    
    // Assert
    expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.getByText(/upload successful/i)).toBeInTheDocument();
    });
  });
});
