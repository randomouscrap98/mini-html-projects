#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define ENDCONFIG "---"
#define REPLACEMENTBUFFER 100000
//Because of weirdness, divide by two to get actual
#define MAXREPLACEMENTS 2000
#define MAXKEY 100
#define MAXVALUE 2000

int main()
{
   //Get EVERYTHING from stdin. Also yeah static allocation, bite me
   char replbuf[REPLACEMENTBUFFER];
   char * rbf = replbuf;

   char * repl[MAXREPLACEMENTS];
   int replc = 0;

   char key[MAXKEY];
   char value[MAXVALUE];
   int scanc = 0;
   
   //Config reading loop
   while(1)
   {
      scanc = scanf("%s", key); // %999[^\n]", key, value);

      if(scanc != 1 || strcmp(ENDCONFIG, key) == 0)
         break;

      scanc = scanf("%1999[^\n]", value); // %999[^\n]", key, value);
      
      if(scanc != 1)
      {
         fprintf(stderr, "Invalid config format, no value found for %s", key);
         return 2;
      }

      printf("Key: %s value: %s", key, value);

      strcpy(rbf, key);
      repl[replc++] = rbf;
      rbf += (strlen(key) + 1);

      strcpy(rbf, value);
      repl[replc++] = rbf;
      rbf += (strlen(value) + 1);
   }

   //Line reading + replacement loop
   while(1)
   {
      scanc = scanf("\n%1999[^\n]", value);

      //Replace on line
      if(scanc == 1)
      {
         printf("%s\n", value);
      }
      else
      {
         break;
      }
   }
}
