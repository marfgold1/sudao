import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpDown, Loader2 } from 'lucide-react';
import { useAMM } from '../hooks/useAMM';
import { toast } from 'react-toastify';

export const SwapWidget: React.FC = () => {
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [isGettingQuote, setIsGettingQuote] = useState(false);
  const [tokenInIsICP, setTokenInIsICP] = useState(true);
  
  const { tokenInfo, liquidityInfo, handleGetQuote, handleSwap } = useAMM();

  const handleGetQuoteClick = async () => {
    if (!amountIn || !tokenInfo) return;
    
    setIsGettingQuote(true);
    try {
      const tokenInId = tokenInIsICP ? tokenInfo.token0! : tokenInfo.token1!;
      const quote = await handleGetQuote(tokenInId.toString(), BigInt(amountIn));
      
      if (quote) {
        setAmountOut(quote && 'ok' in quote ? quote.ok.toString() : '0');
      }
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsGettingQuote(false);
    }
  };

  const handleSwapClick = async () => {
    if (!amountIn || !amountOut || !tokenInfo) return;
    
    setIsSwapping(true);
    try {
      const tokenInId = tokenInIsICP ? tokenInfo.token0! : tokenInfo.token1!;
      const minAmountOut = Math.floor(Number(amountOut) * 0.99); // 1% slippage
      
      const result = await handleSwap(tokenInId.toString(), BigInt(amountIn), BigInt(minAmountOut));
      
      if (result) {
        setAmountIn('');
        setAmountOut('');
        toast.success('Swap completed successfully!');
      }
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsSwapping(false);
    }
  };

  const handleFlipTokens = () => {
    setTokenInIsICP(!tokenInIsICP);
    setAmountIn(amountOut);
    setAmountOut(amountIn);
  };

  if (!tokenInfo || !liquidityInfo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading swap interface...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Swap</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token In */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            From ({tokenInIsICP ? 'ICP' : 'Governance'})
          </label>
          <Input
            type="number"
            placeholder="0.0"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
          />
        </div>

        {/* Flip Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFlipTokens}
            className="rounded-full p-2"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Token Out */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            To ({tokenInIsICP ? 'Governance' : 'ICP'})
          </label>
          <Input
            type="number"
            placeholder="0.0"
            value={amountOut}
            readOnly
            className="bg-gray-50"
          />
        </div>

        {/* Pool Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>Pool: {liquidityInfo.reserve0.toLocaleString()} ICP / {liquidityInfo.reserve1.toLocaleString()} Governance</div>
          <div>Fee: {Number(tokenInfo.fee_rate) / 10}%</div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={handleGetQuoteClick}
            disabled={!amountIn || isGettingQuote}
            variant="outline"
            className="w-full"
          >
            {isGettingQuote ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Getting Quote...
              </>
            ) : (
              'Get Quote'
            )}
          </Button>
          
          <Button
            onClick={handleSwapClick}
            disabled={!amountIn || !amountOut || isSwapping}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isSwapping ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Swapping...
              </>
            ) : (
              'Swap'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};