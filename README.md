//# Gomoku-Game
#include <iostream>
using namespace std;

bool win (bool winner, int board[][15], int X, int Y, int player, int counter)
{
    // 0     we checking for the ones on the sides verticals

    counter=1;
    for (int j=1; j<5; j++)
    {

        if (board[X-j][Y]==player)
        {
            counter++;
            if (board[X+j][Y]==player)
            {
                counter++;
            }
        }

        if (counter ==5)
        {
            winner = true;
            cout<< "Player: "<< player<<"   is winner"<<endl;

        }
    }

    counter=1;
    for (int j=1; j<5; j++)
    {
        // 1     we checking for the ones on the sides horizontal
        if (board[X][Y-j]==player)
        {

            counter++;
            if (board[X][Y+j]==player)
            {
                counter++;
            }
        }

        if (counter ==5)
        {
            winner = true;
            cout<< "Player: "<< player<<"   is winner"<<endl;

        }

    }

    counter=1;
    for (int j=1; j<5; j++)
    {
        //2      we checking for the ones on the sides diagonal 1
        if (board[X+j][Y+j]==player)
        {

            counter++;
            if (board[X-j][Y-j]==player)
            {
                counter++;
            }
        }

        if (counter ==5)
        {
            winner = true;
            cout<< "Player: "<< player<<"   is winner"<<endl;

        }

    }

    counter=1;
    for (int j=1; j<5; j++)
    {
        //3       we checking for the ones on the sides diagonal 2
        if (board[X-j][Y-j]==player)
        {

            counter++;
            if (board[X+j][Y+j]==player)
            {
                counter++;
            }
        }

        if (counter ==5)
        {
            winner = true;
            cout<< "Player: "<< player<<"   is winner"<<endl;

        }

    }
}



void showBoared(int boardS,int vBoard[][15])
{
    cout<<"  ";
    for (int i=0; i<boardS; i++)
    {
        cout<<i<<" ";
    }
    cout<<endl;

    for (int i=0; i<boardS; i++)
    {
        cout<<i<<"|";
        int j;
        for (j=0; j<boardS; j++)
        {
            cout<<vBoard[i][j]<<" ";
        }
        cout<<endl;
    }
}
void posReq(int X,int Y,int board[][15],int player);

int main()

{

    int lines;

    cout <<"Enter the game size: "<<endl;
    cin >>lines;
    int board[lines][15];

    for (int i=0; i<lines; i++)
    {
        for (int j=0; j<lines; j++)
        {

            board[i][j]=0;


        }


    }
    showBoared(lines, board);
    bool winner =false;
    int player;
    int counter;

    int X, Y;

// the function where player one 1 is playing
    while (winner == false)
    {
        player = 1;

        posReq(X,Y,board,player);
        showBoared(lines, board);
        counter=1;
        win(winner,board,X,Y,player, counter);


        // the function where player two 2 is playing


        player = 2;

        posReq(X,Y,board,player);
        showBoared(lines, board);
        counter=1;
        win(winner,board,X, Y,player, counter);

    }
}


void posReq(int X,int Y,int board[][15],int player)
{
    bool validPosition=false;

        cout <<"player: "<<player<<"Please play, it is your turn"<<endl;
        cin>>X>>Y;
        if (board[X][Y]==0)
        {
            board[X][Y]=player;
            validPosition=true;
        }

        else
        {
            while (validPosition==false)
            {
                cout<<"Please play again, this position is occupied " ;
                cin>>X>>Y;
                if (board[X][Y]==0)
                {
                    board[X][Y]=player;
                    validPosition=true;
                }
            }
        }

}
























































































