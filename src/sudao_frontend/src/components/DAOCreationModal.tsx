import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { type CreateDAORequest } from '../services/explorer';

interface DAOCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: CreateDAORequest) => Promise<void>;
  isLoading?: boolean;
}

export const DAOCreationModal: React.FC<DAOCreationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CreateDAORequest>({
    name: '',
    description: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "DAO name is required";
    } else if (formData.name.length > 50) {
      newErrors.name = "DAO name must be under 50 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (formData.tags.length === 0) {
      newErrors.tags = 'At least one tag is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
      if (errors.tags) {
        setErrors(prev => ({ ...prev, tags: '' }));
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      await onSubmit(formData);
      setFormData({ name: '', description: '', tags: [] });
      setTagInput('');
      setErrors({});
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <DialogHeader>
            <DialogTitle>Create New DAO</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                DAO Name <span className='text-red-500'>*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                }}
                placeholder="Enter DAO name"
                className={errors.name ? "border-red-500 focus:border-red-500" : ""}
              />
              <p className="text-sm text-gray-500 mt-1">
                The name should be clear, under 50 characters, and avoid special symbols or emojis. ({formData.name.length}/50)
              </p>
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Description <span className='text-red-500'>*</span>
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, description: e.target.value }));
                  if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                }}
                placeholder="Describe your DAO's mission and goals"
                rows={3}
                className={`w-full resize-none ${errors.description ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              <p className="text-sm text-gray-500 mt-1">Enter what's best describe your collective. (min. 10 characters)</p>
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Tags <span className='text-red-500'>*</span>
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add tags (press Enter)"
                  className={`flex-1 ${errors.description ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  variant="outline"
                  size="sm"
                >
                  Add
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              
              {errors.tags && (
                <p className="text-red-500 text-xs mt-1">{errors.tags}</p>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create DAO'}
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};